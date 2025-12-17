import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Tenant, ResidenceConfig, NodeData, LinkData, OriginMetadata } from '../types';
import { SCHOOL_COLOR } from '../constants';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface RelationshipMapProps {
  tenants: Tenant[];
  residenceConfig: ResidenceConfig[];
  originMetadata?: OriginMetadata;
}

// Heuristic to convert "10 min", "5 km", etc. to pixels
const parseDistanceToPixels = (distStr?: string): number => {
  if (!distStr) return 120; // Default D3 distance (slightly reduced for compactness)

  const str = distStr.toLowerCase().replace(/\s/g, '');
  let value = 0;
  
  const matchNum = str.match(/(\d+)/);
  if (!matchNum) return 120;
  
  value = parseInt(matchNum[0], 10);

  // Time-based (walking/tram)
  if (str.includes('min') || str.includes('mna')) {
    return Math.max(40, Math.min(value * 10, 400));
  }

  // Distance-based (km)
  if (str.includes('km')) {
    return Math.max(40, Math.min(value * 30, 400));
  }

  // Distance-based (meters)
  if (str.includes('m') && !str.includes('km')) {
    return Math.max(30, Math.min(value / 10, 150));
  }

  return 120;
};

const RelationshipMap: React.FC<RelationshipMapProps> = ({ tenants, residenceConfig, originMetadata = {} }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomHandler, setZoomHandler] = useState<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Helper to trigger zoom programmatically
  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomHandler) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(zoomHandler.scaleBy, factor);
  };

  const handleReset = () => {
    if (!svgRef.current || !zoomHandler) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(750).call(zoomHandler.transform, d3.zoomIdentity);
  };

  useEffect(() => {
    if (!tenants.length || !svgRef.current) return;

    // Helper map for quick lookup
    const configMap = new Map<string, ResidenceConfig>(residenceConfig.map(r => [r.id, r]));

    // 1. Process Data - INDEPENDENT CONSTELLATIONS
    // We want unique nodes for each residence, BUT also unique origin nodes PER residence.
    // If "University A" is in Res 1 and Res 2, it should appear twice as distinct nodes.

    const residenceIds = Array.from(new Set(tenants.map(t => t.residenceId)));
    
    // Nodes for Residences (Group 1)
    const residenceNodes: NodeData[] = residenceIds.map((rid) => {
        const idStr = rid as string;
        return { 
          id: idStr, 
          label: configMap.get(idStr)?.name || idStr,
          group: 1, 
          value: 20,
          color: configMap.get(idStr)?.color 
        };
    });

    // Nodes for Origins (Group 2) - KEY CHANGE HERE
    // Instead of a unique set of origin names, we create a composite ID: "RES_ID::ORIGIN_NAME"
    const originNodesMap = new Map<string, NodeData>();
    const links: any[] = [];

    tenants.forEach(t => {
      // Create a unique ID for this school specifically for this residence
      // allowing distinct constellations
      const compositeId = `${t.residenceId}::${t.originName}`;
      
      // Node creation
      if (!originNodesMap.has(compositeId)) {
        originNodesMap.set(compositeId, {
          id: compositeId,
          label: t.originName, // Visual label remains just the name
          group: 2,
          value: 1,
          color: SCHOOL_COLOR
        });
      } else {
        const node = originNodesMap.get(compositeId);
        if (node) node.value++;
      }

      // Link creation (Check if link already exists for this tenant count)
      const existingLink = links.find(l => l.source === t.residenceId && l.target === compositeId);
      if (existingLink) {
        existingLink.value++;
      } else {
        // Look up custom distance
        let distText = undefined;
        if (originMetadata[t.originName]?.distances?.[t.residenceId]) {
             distText = originMetadata[t.originName].distances[t.residenceId];
        }

        links.push({
          source: t.residenceId,
          target: compositeId, // Links to the specific instance of the school
          value: 1,
          distanceText: distText,
          // Helper for distance calc
          originNameRaw: t.originName 
        });
      }
    });

    const nodes: NodeData[] = [...residenceNodes, ...Array.from(originNodesMap.values())];

    // 2. Setup SVG
    const width = 800;
    const height = 600;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous
    
    // Create a container group for zooming
    const g = svg.append("g");

    // Initialize Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    setZoomHandler(() => zoom); // Save zoom instance for buttons

    // 3. Simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links)
          .id((d: any) => d.id)
          .distance((d: any) => {
             // Dynamic Distance Calculation
             // Use originNameRaw which we stored in the link object to look up metadata
             // d.source is Residence Node, d.target is Composite Origin Node
             const schoolName = d.originNameRaw || d.target.label;
             const resId = d.source.id; // Correct because source is the residence node
             
             const distStr = originMetadata[schoolName]?.distances?.[resId];
             return parseDistanceToPixels(distStr);
          })
      )
      // Increased repulsion slightly to separate the constellations
      .force("charge", d3.forceManyBody().strength(-800)) 
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.group === 1 ? 80 : 45));

    // 4. Draw Lines
    const linkGroup = g.append("g");
    
    const linkLine = linkGroup
      .attr("stroke", "#94a3b8") 
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.value) * 2);

    // Labels on links (distance)
    const linkLabel = linkGroup
      .selectAll("text")
      .data(links.filter((d: any) => d.distanceText))
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dy", -3)
      .style("font-size", "9px")
      .style("fill", "#64748b")
      .style("background", "white")
      .text((d: any) => d.distanceText);


    // 5. Draw Nodes Group
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "grab");

    // Add Circles
    node.append("circle")
      .attr("r", (d: any) => d.group === 1 ? 30 : 12) // Slightly larger residences
      .attr("fill", (d: any) => d.color || '#000')
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add Text Labels
    node.append("text")
      .text((d: any) => d.label)
      .attr("x", (d: any) => d.group === 1 ? 35 : 16)
      .attr("y", 5)
      .style("font-size", (d: any) => d.group === 1 ? "14px" : "11px")
      .style("font-weight", (d: any) => d.group === 1 ? "700" : "500")
      .style("fill", "#0f172a") 
      .style("stroke", "white") 
      .style("stroke-width", 3)
      .style("paint-order", "stroke")
      .style("pointer-events", "none");

    // 6. Tick Function
    simulation.on("tick", () => {
      linkLine
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag Functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      d3.select(event.sourceEvent.target.parentNode).attr("cursor", "grabbing");
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      d3.select(event.sourceEvent.target.parentNode).attr("cursor", "grab");
    }

    return () => {
      simulation.stop();
    };
  }, [tenants, residenceConfig, originMetadata]);

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center z-10">
         <h3 className="font-semibold text-slate-800">Cartographie des Flux (Constellations par Résidence)</h3>
         <div className="text-xs text-slate-500 hidden sm:block">
            <span className="mr-3">● Grosses bulles : Résidences</span>
            <span>● Petites bulles : Écoles/Entreprises</span>
         </div>
      </div>
      
      <div className="flex-grow bg-slate-50 relative overflow-hidden">
        <svg ref={svgRef} className="w-full h-full cursor-move" width="100%" height="100%"></svg>
        
        {/* Legend for distance */}
        <div className="absolute top-4 right-4 bg-white/90 p-3 rounded-lg border border-slate-200 shadow-sm text-xs text-slate-600 max-w-[200px]">
           <p className="font-bold mb-1">Moteur Physique :</p>
           <p>Les liens représentent les distances réelles si elles sont renseignées dans les Paramètres.</p>
           <div className="mt-2 flex items-center gap-2">
             <div className="w-8 h-px bg-slate-400"></div>
             <span>Court = Proche</span>
           </div>
           <div className="mt-1 flex items-center gap-2">
             <div className="w-16 h-px bg-slate-400"></div>
             <span>Long = Loin</span>
           </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white p-2 rounded-lg shadow-md border border-slate-200">
          <button 
            onClick={() => handleZoom(1.2)}
            className="p-2 hover:bg-slate-100 rounded-md text-slate-700 transition-colors"
            title="Zoom Avant"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button 
            onClick={() => handleZoom(0.8)}
            className="p-2 hover:bg-slate-100 rounded-md text-slate-700 transition-colors"
            title="Zoom Arrière"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <div className="h-px bg-slate-200 my-1"></div>
          <button 
            onClick={handleReset}
            className="p-2 hover:bg-slate-100 rounded-md text-slate-700 transition-colors"
            title="Réinitialiser la vue"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RelationshipMap;