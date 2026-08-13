import { BrainCircuit, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const ACCENT_STYLES = {
  primary: {
    card: 'border-primary/35 bg-primary/10 text-primary',
    fill: 'rgba(52, 211, 153, 0.2)',
    stroke: 'rgba(52, 211, 153, 0.95)',
  },
  accent: {
    card: 'border-accent/35 bg-accent/10 text-accent',
    fill: 'rgba(134, 239, 172, 0.18)',
    stroke: 'rgba(134, 239, 172, 0.95)',
  },
  warning: {
    card: 'border-warning/35 bg-warning/10 text-warning',
    fill: 'rgba(250, 204, 21, 0.18)',
    stroke: 'rgba(250, 204, 21, 0.95)',
  },
};

const NODE_WIDTH = 170;
const NODE_HEIGHT = 96;

const ConceptDiagramPanel = ({ diagram, compact = false }) => {
  if (!diagram) {
    return null;
  }

  const columns = diagram.layout?.columns || 1;
  const rows = diagram.layout?.rows || 1;

  const getNodeCoordinates = (node) => {
    const left = ((node.position.col - 0.5) / columns) * 100;
    const top = ((node.position.row - 0.5) / rows) * 100;
    return { left, top };
  };

  const nodeMap = new Map(diagram.nodes.map((node) => [node.nodeId, node]));
  const containerHeight = compact ? Math.max(rows * 140, 240) : Math.max(rows * 165, 280);

  return (
    <div className="popup-diagram-shell">
      <div className="popup-diagram-header">
        <div className="popup-diagram-header-row">
          <div>
            <div className="popup-section-label popup-section-label-accent">
              <BrainCircuit size={14} />
              Concept Diagram
            </div>
            <h4 className="popup-diagram-title">{diagram.title}</h4>
            <p className="popup-diagram-subtitle">{diagram.subtitle}</p>
          </div>
          <div className="popup-diagram-badge">
            <Sparkles size={14} />
            Generated Explainer
          </div>
        </div>
      </div>

      <div className="popup-diagram-body">
        <div className="popup-diagram-canvas-wrap">
          <div className="popup-diagram-canvas" style={{ height: `${containerHeight}px` }}>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="diagramEdgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(52, 211, 153, 0.2)" />
                  <stop offset="50%" stopColor="rgba(74, 222, 128, 0.95)" />
                  <stop offset="100%" stopColor="rgba(134, 239, 172, 0.25)" />
                </linearGradient>
              </defs>
              {diagram.edges.map((edge) => {
                const fromNode = nodeMap.get(edge.from);
                const toNode = nodeMap.get(edge.to);
                if (!fromNode || !toNode) {
                  return null;
                }

                const from = getNodeCoordinates(fromNode);
                const to = getNodeCoordinates(toNode);
                const midX = (from.left + to.left) / 2;
                const midY = (from.top + to.top) / 2;

                return (
                  <g key={`${edge.from}-${edge.to}-${edge.label}`}>
                    <line
                      x1={from.left}
                      y1={from.top}
                      x2={to.left}
                      y2={to.top}
                      stroke="url(#diagramEdgeGradient)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeDasharray="0.1 0"
                    />
                    <circle cx={to.left} cy={to.top} r="1.05" fill="rgba(134, 239, 172, 0.9)" />
                    <rect
                      x={midX - 4.8}
                      y={midY - 2.2}
                      width="9.6"
                      height="4.4"
                      rx="2"
                      fill="rgba(3, 10, 6, 0.96)"
                      stroke="rgba(52, 211, 153, 0.28)"
                    />
                    <text
                      x={midX}
                      y={midY + 0.9}
                      textAnchor="middle"
                      fontSize="1.15"
                      fill="rgba(220, 252, 231, 0.88)"
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {diagram.nodes.map((node, index) => {
              const position = getNodeCoordinates(node);
              const accent = ACCENT_STYLES[node.accent] || ACCENT_STYLES.primary;

              return (
                <motion.div
                  key={node.nodeId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                  className={`popup-diagram-node ${accent.card}`}
                  style={{
                    width: `${compact ? NODE_WIDTH - 10 : NODE_WIDTH}px`,
                    minHeight: `${compact ? NODE_HEIGHT - 8 : NODE_HEIGHT}px`,
                    left: `${position.left}%`,
                    top: `${position.top}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundImage: `linear-gradient(180deg, ${accent.fill}, rgba(4, 10, 7, 0.92))`,
                    boxShadow: `0 0 0 1px ${accent.stroke.replace('0.95', '0.12')}, 0 18px 40px rgba(0, 0, 0, 0.28)`,
                  }}
                >
                  <div className="popup-diagram-node-label">
                    {node.label}
                  </div>
                  <p className="popup-diagram-node-copy">{node.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="popup-diagram-summary-grid">
          {diagram.summaryPoints?.map((point) => (
            <div key={point} className="popup-diagram-summary-card">
              {point}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConceptDiagramPanel;
