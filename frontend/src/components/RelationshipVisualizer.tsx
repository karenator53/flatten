import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  SimpleGrid,
  Flex,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { ComponentAnalysis } from '../../../src/mcp/openaiClient';
import { FiArrowRight, FiArrowLeft, FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';
import MermaidDiagram from './MermaidDiagram';

interface RelationshipVisualizerProps {
  analysis: ComponentAnalysis;
}

const RelationshipVisualizer: React.FC<RelationshipVisualizerProps> = ({ analysis }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const isDark = useColorModeValue(false, true);

  // Generate Mermaid diagram definition with enhanced styling
  const generateMermaidDiagram = () => {
    let diagram = 'graph TD;\n';
    
    // Add styling directives with improved visibility
    diagram += `%% Styling definitions\n`;
    diagram += `classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px;\n`;
    diagram += `classDef main fill:#e1f5fe,stroke:#0288d1,stroke-width:3px;\n`;
    diagram += `classDef dependency fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;\n`;
    diagram += `classDef dataflow fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;\n\n`;
    
    // Add main component with enhanced styling and description
    diagram += `${analysis.name}["${analysis.type}: ${analysis.name}\n${analysis.description.slice(0, 50)}..."];\n`;
    diagram += `class ${analysis.name} main;\n\n`;
    
    // Add dependencies with improved styling and descriptions
    if (analysis.relationships?.dependencies) {
      diagram += `%% Dependencies\n`;
      analysis.relationships.dependencies.forEach((dep, index) => {
        const depId = `dep${index}`;
        diagram += `${depId}["${dep.type}: ${dep.name}\n${dep.description.slice(0, 30)}..."];\n`;
        diagram += `${depId} -->|${dep.type}| ${analysis.name};\n`;
        diagram += `class ${depId} dependency;\n`;
      });
    }
    
    // Add dependents with improved styling and descriptions
    if (analysis.relationships?.dependents) {
      diagram += `\n%% Dependents\n`;
      analysis.relationships.dependents.forEach((dep, index) => {
        const depId = `dependent${index}`;
        diagram += `${depId}["${dep.type}: ${dep.name}\n${dep.description.slice(0, 30)}..."];\n`;
        diagram += `${analysis.name} -->|${dep.type}| ${depId};\n`;
        diagram += `class ${depId} dependency;\n`;
      });
    }
    
    // Add data flow with improved styling and bidirectional arrows
    if (analysis.relationships?.dataFlow) {
      diagram += `\n%% Data Flow\n`;
      analysis.relationships.dataFlow.forEach((flow, index) => {
        const flowId = `flow${index}`;
        diagram += `${flowId}["${flow.component}\n${flow.description.slice(0, 30)}..."];\n`;
        if (flow.direction === 'in') {
          diagram += `${flowId} -->|data flow| ${analysis.name};\n`;
        } else if (flow.direction === 'out') {
          diagram += `${analysis.name} -->|data flow| ${flowId};\n`;
        } else {
          diagram += `${analysis.name} <--> ${flowId};\n`;
        }
        diagram += `class ${flowId} dataflow;\n`;
      });
    }
    
    return diagram;
  };

  const renderChakraRelationships = () => {
    return (
      <VStack spacing={6} align="stretch">
        {/* Dependencies Section */}
        {analysis.relationships?.dependencies && analysis.relationships.dependencies.length > 0 && (
          <Box>
            <Heading size="sm" mb={3}>Dependencies</Heading>
            <SimpleGrid columns={[1, 2, 3]} spacing={4}>
              {analysis.relationships.dependencies.map((dep, index) => (
                <Tooltip 
                  key={index}
                  label={dep.description}
                  placement="top"
                  hasArrow
                >
                  <Box 
                    p={4}
                    bg={bgColor}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={borderColor}
                    cursor="help"
                    transition="all 0.2s"
                    _hover={{ shadow: "md" }}
                  >
                    <Flex align="center" gap={2}>
                      <Icon as={FiArrowUpRight} />
                      <Badge colorScheme="blue">{dep.type}</Badge>
                      <Text fontWeight="bold">{dep.name}</Text>
                    </Flex>
                    <Text mt={2} fontSize="sm" noOfLines={2}>{dep.description}</Text>
                  </Box>
                </Tooltip>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Dependents Section */}
        {analysis.relationships?.dependents && analysis.relationships.dependents.length > 0 && (
          <Box>
            <Heading size="sm" mb={3}>Dependents</Heading>
            <SimpleGrid columns={[1, 2, 3]} spacing={4}>
              {analysis.relationships.dependents.map((dep, index) => (
                <Tooltip 
                  key={index}
                  label={dep.description}
                  placement="top"
                  hasArrow
                >
                  <Box 
                    p={4}
                    bg={bgColor}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={borderColor}
                    cursor="help"
                    transition="all 0.2s"
                    _hover={{ shadow: "md" }}
                  >
                    <Flex align="center" gap={2}>
                      <Icon as={FiArrowDownRight} />
                      <Badge colorScheme="purple">{dep.type}</Badge>
                      <Text fontWeight="bold">{dep.name}</Text>
                    </Flex>
                    <Text mt={2} fontSize="sm" noOfLines={2}>{dep.description}</Text>
                  </Box>
                </Tooltip>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Data Flow Section */}
        {analysis.relationships?.dataFlow && analysis.relationships.dataFlow.length > 0 && (
          <Box>
            <Heading size="sm" mb={3}>Data Flow</Heading>
            <SimpleGrid columns={[1, 2, 3]} spacing={4}>
              {analysis.relationships.dataFlow.map((flow, index) => (
                <Tooltip 
                  key={index}
                  label={flow.description}
                  placement="top"
                  hasArrow
                >
                  <Box 
                    p={4}
                    bg={bgColor}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={borderColor}
                    cursor="help"
                    transition="all 0.2s"
                    _hover={{ shadow: "md" }}
                  >
                    <Flex align="center" gap={2}>
                      <Icon 
                        as={flow.direction === 'in' ? FiArrowLeft : 
                            flow.direction === 'out' ? FiArrowRight : 
                            FiArrowRight}
                      />
                      <Badge colorScheme="green">{flow.direction}</Badge>
                      <Text fontWeight="bold">{flow.component}</Text>
                    </Flex>
                    <Text mt={2} fontSize="sm" noOfLines={2}>{flow.description}</Text>
                  </Box>
                </Tooltip>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </VStack>
    );
  };

  return (
    <Box mt={6}>
      <Heading size="md" mb={4}>Component Relationships</Heading>
      <Tabs variant="enclosed">
        <TabList>
          <Tab>Visual Layout</Tab>
          <Tab>Flow Diagram</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {renderChakraRelationships()}
          </TabPanel>
          <TabPanel>
            <Box 
              p={4} 
              bg={bgColor} 
              borderRadius="md" 
              borderWidth="1px" 
              borderColor={borderColor}
              overflow="auto"
            >
              <MermaidDiagram
                chart={generateMermaidDiagram()}
                config={{
                  theme: isDark ? 'dark' : 'default',
                  flowchart: {
                    curve: 'monotoneX',
                    padding: 20,
                    rankSpacing: 50,
                    nodeSpacing: 50,
                    htmlLabels: true,
                  },
                }}
              />
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default RelationshipVisualizer; 