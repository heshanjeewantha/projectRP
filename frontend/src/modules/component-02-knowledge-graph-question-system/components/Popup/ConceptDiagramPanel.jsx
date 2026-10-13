import { BrainCircuit, Sparkles, BookOpen, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const NODE_WIDTH = 210;
const NODE_HEIGHT = 92;

const ConceptDiagramPanel = ({ diagram }) => {
  if (!diagram || !diagram.nodes || diagram.nodes.length === 0) {
    return null;
  }

  const columns = Math.max(diagram.layout?.columns || 1, 1);
  const rows = Math.max(diagram.layout?.rows || 1, 1);

  // Generous height to ensure 90px+ vertical gap between rows
  const containerHeight = rows === 1 ? 280 : rows === 2 ? 400 : 540;

  // Percentage coordinates with margins so cards never clip canvas borders
  const getNodeCoordinates = (node) => {
    let left = 50;
    if (columns > 1) {
      // col 1 -> 18%, col 2 -> 50%, col 3 -> 82%
      left = 18 + ((node.position.col - 1) / (columns - 1)) * 64;
    }

    let top = 50;
    if (rows === 2) {
      top = node.position.row === 1 ? 28 : 72;
    } else if (rows >= 3) {
      // row 1 -> 18%, row 2 -> 52%, row 3 -> 86%
      top = 18 + ((node.position.row - 1) / (rows - 1)) * 68;
    }

    return { left, top };
  };

  const nodeMap = new Map(diagram.nodes.map((node) => [node.nodeId, node]));

  return (
    <div className="popup-diagram-shell">
      {/* Header */}
      <div className="popup-diagram-header">
        <div className="popup-diagram-header-row">
          <div>
            <div className="popup-section-label popup-section-label-accent">
              <BrainCircuit size={14} />
              Concept Diagram
            </div>
            <h4 className="popup-diagram-title">{diagram.title}</h4>
            <p className="popup-diagram-subtitle">
              {diagram.description ||
                (diagram.subtitle &&
                !diagram.subtitle.includes('Interactive Curriculum Concept Map') &&
                !diagram.subtitle.includes('Interactive Knowledge Graph')
                  ? diagram.subtitle
                  : `Core curriculum concepts and topic dependencies covered in ${diagram.title || 'this lesson'}.`)}
            </p>
          </div>
          <div className="popup-diagram-badge">
            <Sparkles size={14} />
            Generated Explainer
          </div>
        </div>
      </div>

      {/* Body & Interactive Graph Canvas */}
      <div className="popup-diagram-body">
        <div className="popup-diagram-canvas-wrap">
          <div
            className="popup-diagram-canvas"
            style={{ height: `${containerHeight}px` }}
          >
            {/* SVG Connector Lines */}
            <svg
              className="absolute inset-0 h-full w-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="diagramEdgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#10b981" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              {diagram.edges?.map((edge, eIdx) => {
                const fromNode = nodeMap.get(edge.from);
                const toNode = nodeMap.get(edge.to);
                if (!fromNode || !toNode) return null;

                const from = getNodeCoordinates(fromNode);
                const to = getNodeCoordinates(toNode);

                return (
                  <g key={`edge-line-${edge.from}-${edge.to}-${eIdx}`}>
                    <line
                      x1={`${from.left}%`}
                      y1={`${from.top}%`}
                      x2={`${to.left}%`}
                      y2={`${to.top}%`}
                      stroke="url(#diagramEdgeGradient)"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={`${to.left}%`}
                      cy={`${to.top}%`}
                      r="4"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Edge Badges (HTML pills placed in the empty gap between nodes) */}
            {diagram.edges?.map((edge, eIdx) => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);
              if (!fromNode || !toNode) return null;

              const from = getNodeCoordinates(fromNode);
              const to = getNodeCoordinates(toNode);
              const midX = (from.left + to.left) / 2;
              const midY = (from.top + to.top) / 2;

              return (
                <div
                  key={`edge-badge-${edge.from}-${edge.to}-${eIdx}`}
                  className="popup-diagram-edge-badge"
                  style={{
                    left: `${midX}%`,
                    top: `${midY}%`,
                  }}
                >
                  {edge.label}
                </div>
              );
            })}

            {/* Nodes */}
            {diagram.nodes.map((node, index) => {
              const position = getNodeCoordinates(node);
              const isRoot = node.nodeId === 'root_node' || node.position.row === 1;

              return (
                <motion.div
                  key={node.nodeId}
                  initial={{ opacity: 0, scale: 0.92, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: index * 0.05 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  className={`popup-diagram-node ${isRoot ? 'is-root-node' : ''}`}
                  style={{
                    width: `${NODE_WIDTH}px`,
                    minHeight: `${NODE_HEIGHT}px`,
                    left: `${position.left}%`,
                    top: `${position.top}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="popup-diagram-node-header">
                    <span className={`popup-diagram-node-badge ${isRoot ? 'is-root-badge' : ''}`}>
                      {isRoot ? (
                        <>
                          <BookOpen size={10} className="inline mr-1" />
                          Central Topic
                        </>
                      ) : (
                        <>
                          <Layers size={10} className="inline mr-1" />
                          Concept {index}
                        </>
                      )}
                    </span>
                  </div>

                  <div className="popup-diagram-node-title" title={node.label}>
                    {node.label}
                  </div>

                  <p className="popup-diagram-node-desc" title={node.text}>
                    {node.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Summary Points Footer */}
        {diagram.summaryPoints?.length > 0 && (
          <div className="popup-diagram-summary-grid">
            {diagram.summaryPoints.map((point) => (
              <div key={point} className="popup-diagram-summary-card">
                {point}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConceptDiagramPanel;
