import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import "./App.css";

const SAMPLE_JSON = `{
  "user": {
    "name": "Alice",
    "age": 25,
    "address": { "city": "Delhi", "zip": 110001 },
    "hobbies": ["music", "reading"]
  },
  "active": true
}`;

function buildNodesEdges(json, x = 0, y = 0, parent = "$") {
  const nodes = [];
  const edges = [];
  const type = Array.isArray(json)
    ? "array"
    : typeof json === "object" && json !== null
    ? "object"
    : "primitive";

  const id = parent;
  const label =
    type === "primitive" ? `${parent.split(".").pop()} : ${json}` : parent;

  nodes.push({
    id,
    position: { x, y },
    data: { label },
    style: {
      padding: 6,
      borderRadius: 6,
      background:
        type === "object" ? "#6d28d9" : type === "array" ? "#059669" : "#f59e0b",
      color: "#fff",
      fontSize: 12,
      border: "2px solid transparent",
    },
  });

  if (type === "object" || type === "array") {
    const entries = type === "object" ? Object.entries(json) : json.entries();
    let i = 0;
    for (const [k, v] of entries) {
      const childId = type === "object" ? `${parent}.${k}` : `${parent}[${k}]`;
      const childX = x + (i - 1) * 200;
      const childY = y + 120;
      const { nodes: childNodes, edges: childEdges } = buildNodesEdges(
        v,
        childX,
        childY,
        childId
      );
      nodes.push(...childNodes);
      edges.push(...childEdges, { id: `${id}->${childId}`, source: id, target: childId });
      i++;
    }
  }
  return { nodes, edges };
}

export default function App() {
  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [rfInstance, setRfInstance] = useState(null);

  const generateTree = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      const { nodes: builtNodes, edges: builtEdges } = buildNodesEdges(parsed);
      setNodes(builtNodes);
      setEdges(builtEdges);
      setError("");
      setMessage("");
      setTimeout(() => rfInstance && rfInstance.fitView({ padding: 0.9 }), 120);
    } catch (e) {
      setError("❌ Invalid JSON");
    }
  }, [jsonText, setNodes, setEdges, rfInstance]);

  const handleSearch = () => {
    if (!search) {
      setMessage("Please type something to search");
      return;
    }
    const match = nodes.find((n) =>
      n.id.toLowerCase().includes(search.toLowerCase())
    );

    if (match) {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          style: {
            ...n.style,
            border: n.id === match.id ? "3px solid #ff0000" : "2px solid transparent",
          },
        }))
      );
      if (rfInstance && typeof rfInstance.setCenter === "function") {
        rfInstance.setCenter(match.position.x, match.position.y, { zoom: 1.5, duration: 800 });
      }
      setMessage("✅ Match found");
    } else {
      setMessage("❌ No match found");
      setNodes((nds) =>
        nds.map((n) => ({ ...n, style: { ...n.style, border: "2px solid transparent" } }))
      );
    }
  };

  useEffect(generateTree, [generateTree]);

  return (
    <div className="app">
      <div className="sidebar">
        <h3>JSON Tree Visualizer</h3>
        <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
        <button onClick={generateTree}>Generate Tree</button>
        {error && <p className="error">{error}</p>}

        <div className="search-section">
          <input
            type="text"
            placeholder=" e.g $.user.name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={handleSearch}>Search</button>
          {message && <p className="msg">{message}</p>}
        </div>
      </div>

      <div className="flow-area">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          onInit={(instance) => setRfInstance(instance)}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}

