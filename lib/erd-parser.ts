import { Node, Edge, Position } from "@xyflow/react";
import { TableNodeData, Column } from "@/components/erd/table-node";

/**
 * Parses a simple DSL into nodes and edges.
 * Syntax:
 * table name {
 *   col_name type [pk] [fk other_table.other_col]
 * }
 */
export function parseDsl(
  code: string,
  existingNodes: Node[],
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Remove comments before parsing
  const cleanCode = code.replace(/\/\/.*|#.*/g, '');

  const tableRegex = /table\s+(\w+)\s*{([^}]*)}/gi;
  let match;

  const existingPositions = new Map<string, { x: number; y: number }>();
  existingNodes.forEach((n) => {
    const data = n.data as TableNodeData;
    if (data.label) {
      existingPositions.set(data.label.toLowerCase(), n.position);
    }
  });

  while ((match = tableRegex.exec(cleanCode)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const tableId = `table-${tableName.toLowerCase()}`;

    const columnLines = body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const columns: Column[] = [];

    columnLines.forEach((line) => {
      const parts = line.split(/\s+/);
      const name = parts[0];
      const type = parts[1] || "text";
      const isPrimary = line.toLowerCase().includes(" pk");
      
      // Look for fk table.col pattern
      const fkMatch = line.match(/fk\s+([\w.]+)/i);
      const fkTarget = fkMatch ? fkMatch[1] : null;
      
      const colId = `${tableId}-${name.toLowerCase()}`;

      columns.push({
        id: colId,
        name,
        type,
        isPrimary,
        isForeignKey: !!fkTarget,
      });

      // Handle Foreign Keys
      if (fkTarget) {
        const [targetTable, targetCol] = fkTarget.split(".");
        if (targetTable && targetCol) {
          edges.push({
            id: `edge-${tableId}-${name}-to-${targetTable}-${targetCol}`,
            source: tableId,
            sourceHandle: `${colId}-right`,
            target: `table-${targetTable.toLowerCase()}`,
            targetHandle: `table-${targetTable.toLowerCase()}-${targetCol.toLowerCase()}-left`,
            animated: true,
            style: { stroke: "#3b82f6", strokeWidth: 2 },
          });
        }
      }
    });

    const position = existingPositions.get(tableName.toLowerCase()) || {
      x: Math.random() * 400,
      y: Math.random() * 400,
    };

    nodes.push({
      id: tableId,
      type: "table",
      position,
      data: {
        label: tableName,
        columns,
      },
    });
  }

  // Handle Enums
  const enumRegex = /enum\s+(\w+)\s*{([^}]*)}/gi;
  while ((match = enumRegex.exec(cleanCode)) !== null) {
    const enumName = match[1];
    const body = match[2];
    const enumId = `enum-${enumName.toLowerCase()}`;

    const values = body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    
    const columns: Column[] = values.map((val, idx) => ({
      id: `${enumId}-${idx}`,
      name: val,
      type: 'val',
    }));

    const position = existingPositions.get(enumName.toLowerCase()) || {
      x: Math.random() * 400,
      y: Math.random() * 400,
    };

    nodes.push({
      id: enumId,
      type: "table", // Reuse table node for now, or we could add 'enum' type
      position,
      data: {
        label: enumName,
        isEnum: true, // Tag it as enum
        columns,
      },
    });
  }

  return { nodes, edges };
}

/**
 * Converts nodes and edges back to DSL code.
 */
export function generateDsl(nodes: Node[], edges: Edge[]): string {
  const tableDsl = nodes
    .filter((n) => n.type === 'table' && !(n.data as TableNodeData).isEnum)
    .map((node) => {
      const data = node.data as TableNodeData;
      const colLines = data.columns.map((col) => {
        let line = `  ${col.name} ${col.type}`;
        if (col.isPrimary) line += " pk";
        
        // Find if this column is a source of any edge
        const outboundEdge = edges.find(e => e.source === node.id && e.sourceHandle === `${col.id}-right`);
        if (outboundEdge) {
          const targetTableNode = nodes.find(n => n.id === outboundEdge.target);
          if (targetTableNode) {
            const targetTableName = (targetTableNode.data as TableNodeData).label;
            const targetData = targetTableNode.data as TableNodeData;
            const targetCol = targetData.columns.find(c => `${c.id}-left` === outboundEdge.targetHandle);
            if (targetCol) {
              line += ` fk ${targetTableName}.${targetCol.name}`;
            }
          }
        }
        
        return line;
      });
      return `table ${data.label} {\n${colLines.join("\n")}\n}`;
    })
    .join("\n\n");

  const enumDsl = nodes
    .filter((n) => n.type === 'table' && (n.data as TableNodeData).isEnum)
    .map((node) => {
      const data = node.data as TableNodeData;
      const values = data.columns.map(c => `  ${c.name}`).join("\n");
      return `enum ${data.label} {\n${values}\n}`;
    })
    .join("\n\n");

  return [tableDsl, enumDsl].filter(Boolean).join("\n\n");
}
