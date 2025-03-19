import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Minus, User, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface HierarchyNode {
  id: number;
  clientId: number;
  username: string;
  parentClientId: number | null;
  children?: HierarchyNode[];
  type: 'agent' | 'player';
  balance?: number;
  isExpanded?: boolean;
}

interface UserHierarchyTreeProps {
  manager: string;
  hierarchyData: HierarchyNode;
  isLoading?: boolean;
  onUserSelect?: (user: HierarchyNode) => void;
}

export default function UserHierarchyTree({
  manager,
  hierarchyData,
  isLoading = false,
  onUserSelect,
}: UserHierarchyTreeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({
    [hierarchyData.id]: true // Root node is expanded by default
  });

  // Function to toggle node expansion
  const toggleNode = (id: number) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Function to filter hierarchy based on search
  const filterHierarchy = (node: HierarchyNode, query: string): HierarchyNode | null => {
    if (!query) return { ...node, isExpanded: true };
    
    const matchesSearch = node.username.toLowerCase().includes(query.toLowerCase());
    
    let filteredChildren: HierarchyNode[] = [];
    if (node.children) {
      node.children.forEach(child => {
        const filteredChild = filterHierarchy(child, query);
        if (filteredChild) filteredChildren.push(filteredChild);
      });
    }
    
    if (matchesSearch || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children,
        isExpanded: true, // Always expand nodes in search results
      };
    }
    
    return null;
  };

  const renderHierarchyNode = (node: HierarchyNode, level = 0) => {
    const isExpanded = node.isExpanded ?? expandedNodes[node.id] ?? false;
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id} className="mb-1">
        <div 
          className={`flex items-center p-2 rounded-md transition-all
            ${level > 0 ? 'ml-' + (level * 6) : ''}
            ${node.type === 'agent' ? 'bg-secondary/10 hover:bg-secondary/20' : 'hover:bg-muted'}
          `}
          onClick={() => onUserSelect && onUserSelect(node)}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
            >
              {isExpanded ? (
                <Minus className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <span className="w-7" />
          )}
          
          {node.type === 'agent' ? (
            <Users className="h-4 w-4 mr-2 text-primary" />
          ) : (
            <User className="h-4 w-4 mr-2" />
          )}
          
          <span className="font-medium">{node.username}</span>
          
          {node.type === 'agent' && (
            <Badge variant="outline" className="ml-2 text-xs">
              Agent
            </Badge>
          )}
          
          {node.balance !== undefined && (
            <span className="ml-auto text-sm">
              ₱{node.balance.toLocaleString()}
            </span>
          )}
        </div>
        
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {node.children?.map(child => renderHierarchyNode(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Process hierarchy data based on search query
  const processedHierarchy = searchQuery 
    ? filterHierarchy(hierarchyData, searchQuery) || hierarchyData
    : hierarchyData;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Loading Hierarchy...</CardTitle>
          <CardDescription>Please wait while we fetch data</CardDescription>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="animate-pulse w-full h-60 bg-muted rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{manager} User Hierarchy</CardTitle>
        <CardDescription>
          Network structure and relationships
        </CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-medium">
              <Users className="h-3 w-3 mr-1" />
              {processedHierarchy.children?.length || 0} Direct Agents
            </Badge>
            
            <Badge variant="outline" className="font-medium">
              <User className="h-3 w-3 mr-1" />
              Total Players: {/* Calculate the total number of players in hierarchy */}
              {calculateTotalPlayers(processedHierarchy)}
            </Badge>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              // Expand all nodes
              const allNodes: Record<number, boolean> = {};
              traverseNodes(processedHierarchy, (node) => {
                allNodes[node.id] = true;
              });
              setExpandedNodes(allNodes);
            }}
          >
            Expand All
          </Button>
        </div>
        
        <Separator className="my-2" />
        
        <div className="mt-2">
          {renderHierarchyNode(processedHierarchy)}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate total players in hierarchy
function calculateTotalPlayers(node: HierarchyNode): number {
  let count = node.type === 'player' ? 1 : 0;
  
  if (node.children) {
    node.children.forEach(child => {
      count += calculateTotalPlayers(child);
    });
  }
  
  return count;
}

// Helper function to traverse all nodes
function traverseNodes(node: HierarchyNode, callback: (node: HierarchyNode) => void) {
  callback(node);
  if (node.children) {
    node.children.forEach(child => traverseNodes(child, callback));
  }
}