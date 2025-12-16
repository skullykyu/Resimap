import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Tenant, ResidenceConfig, NodeData, LinkData } from '../types';
import { SCHOOL_COLOR } from '../constants';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface RelationshipMapProps {
  tenants: Tenant[];
  residenceConfig: ResidenceConfig[];
}

const RelationshipMap: React.FC<RelationshipMapProps> = ({ tenants, residenceConfig }) => {
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

    // 1. Process Data
    const residenceIds = Array.from(new Set(tenants.map(t => t.residenceId)));
    const origins = Array.from(new Set(tenants.map(t => t.originName)));

    const nodes: NodeData[] = [
      ...residenceIds.map((rid) => {
        const idStr = rid as string;
        return { 
          id: idStr, 
          label: configMap.get(idStr)?.name || idStr,
          group: 1, 
          value: 20,
          color: configMap.get(idStr)?.color 
        };
      }),
      ...origins.map((o) => {
        const oStr = o as string;
        return { 
          id: oStr, 
          label: oStr,
          group: 2, 
          value: 5,
          color: SCHOOL_COLOR
        };
      })
    ];

    const links: LinkData[] = [];
    tenants.forEach(t => {
      const existingLink = links.find(l => l.source === t.residenceId && l.target === t.originName);
      if (existingLink) {
        existingLink.value++;
      } else {
        links.push({ source: t.residenceId, target: t.originName, value: 1 });
      }
    });

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
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.group === 1 ? 60 : 35));

    // 4. Draw Lines
    const link = g.append("g")
      .attr("stroke", "#94a3b8") // Slate-400
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d) => Math.sqrt(d.value) * 2);

    // 5. Draw Nodes Group
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "grab");

    // Add Circles
    node.append("circle")
      .attr("r", (d: any) => d.group === 1 ? 25 : 12)
      .attr("fill", (d: any) => d.color || '#000')
      .attr("stroke", "#fff") // White border ONLY on the circle
      .attr("stroke-width", 2)
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add Text Labels
    node.append("text")
      .text((d: any) => d.label)
      .attr("x", (d: any) => d.group === 1 ? 30 : 16)
      .attr("y", 5)
      .style("font-size", (d: any) => d.group === 1 ? "14px" : "12px")
      .style("font-weight", (d: any) => d.group === 1 ? "700" : "500")
      .style("fill", "#0f172a") // Slate-900 (Black-ish)
      .style("stroke", "none") // Ensure no stroke on text
      .style("pointer-events", "none")
      .style("text-shadow", "1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff"); // Halo effect for better readability

    // 6. Tick Function
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

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
  }, [tenants, residenceConfig]);

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center z-10">
         <h3 className="font-semibold text-slate-800">Cartographie des Flux (Réseau)</h3>
         <div className="text-xs text-slate-500 hidden sm:block">
            <span className="mr-3">● Grosses bulles : Résidences</span>
            <span>● Petites bulles : Écoles/Entreprises</span>
         </div>
      </div>
      
      <div className="flex-grow bg-slate-50 relative overflow-hidden">
        <svg ref={svgRef} className="w-full h-full cursor-move" width="100%" height="100%"></svg>
        
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