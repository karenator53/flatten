import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  VStack,
  Text,
  Heading,
  Flex,
  Container,
  Input,
  useToast,
  Code,
  Badge,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Grid,
  GridItem,
  HStack,
  Divider,
  useColorModeValue,
  UnorderedList,
  ListItem,
  Wrap,
  WrapItem,
  Switch,
  FormLabel
} from '@chakra-ui/react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import axios from 'axios'
import { ComponentAnalysis } from '../../../src/mcp/openaiClient'
import RelationshipVisualizer from './RelationshipVisualizer'
import MermaidDiagram from './MermaidDiagram'

// Define the relationship types based on the ComponentAnalysis interface
type RelationshipType = 'import' | 'function_call' | 'inheritance' | 'composition' | 'event_handler' | 'class' | 'component';

interface Relationship {
  name: string;
  type: RelationshipType;
  description: string;
}

interface Output {
  name: string;
  type: string;
  description: string;
}

interface ComponentRelationships {
  dependencies: Relationship[];
  dependents: Relationship[];
  outputs: Output[];
}

interface Parameter {
  name: string;
  type: string;
  description: string;
}

interface Method {
  name: string;
  type: RelationshipType;
  documentation?: string;
}

interface CodeFunction {
  name: string;
  type: 'function';
  parameters: Parameter[];
  returnType: string;
  documentation?: string;
  codeSnippet: string;
}

interface CodeClass {
  name: string;
  type: 'class';
  methods: Method[];
  documentation?: string;
}

type ComponentType = 'function' | 'class' | 'component';

interface AnalysisResponse {
  codeOutput: {
    functions: CodeFunction[];
    classes: CodeClass[];
  };
  aiAnalysis: {
    overview: {
      description: string;
      architecture: string;
      mainComponents: string[];
      dataFlow: string;
      technicalStack: string[];
    };
    components: ComponentAnalysis[];
    dependencies: {
      nodes: Array<{
        id: string;
        type: string;
        description: string;
      }>;
      edges: Array<{
        from: string;
        to: string;
        type: RelationshipType;
        description: string;
      }>;
    };
  };
}

// Move helper functions outside the component
const safeArray = <T,>(arr: T[] | undefined | null): T[] => {
  return Array.isArray(arr) ? arr : [];
};

const safeObject = <T,>(obj: T | undefined | null): T => {
  return obj || {} as T;
};

const generateDependencyDiagram = (dependencies: AnalysisResponse['aiAnalysis']['dependencies'] | undefined) => {
  if (!dependencies) {
    console.warn('No dependency data available');
    return 'graph TD;\n  A[No Dependencies Available]';
  }

  // Start with graph definition
  const diagram = [
    'graph TD;',
    ''
  ];

  // Add nodes with proper escaping and formatting
  diagram.push('%% Nodes');
  safeArray(dependencies.nodes).forEach(node => {
    const nodeId = `node_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const nodeLabel = `${node.type}: ${node.id}`
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    diagram.push(`${nodeId}["${nodeLabel}"];`);
  });
  diagram.push('');
  
  // Add edges with proper formatting
  diagram.push('%% Edges');
  safeArray(dependencies.edges).forEach(edge => {
    const fromId = `node_${edge.from.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const toId = `node_${edge.to.replace(/[^a-zA-Z0-9]/g, '_')}`;
    diagram.push(`${fromId}-->|${edge.type}|${toId};`);
  });
  diagram.push('');

  // Add style definitions (after nodes but before class assignments)
  diagram.push('%% Styles');
  diagram.push('classDef default fill:#f9f9f9,stroke:#333,stroke-width:1px;');
  diagram.push('classDef function fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;');
  diagram.push('classDef class fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;');
  diagram.push('classDef component fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;');
  diagram.push('');

  // Add class assignments last
  diagram.push('%% Class assignments');
  safeArray(dependencies.nodes).forEach(node => {
    const nodeId = `node_${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const nodeType = node.type.toLowerCase();
    if (['function', 'class', 'component'].includes(nodeType)) {
      diagram.push(`class ${nodeId} ${nodeType};`);
    }
  });

  // Join with newlines and log the output for debugging
  const result = diagram.join('\n');
  console.log('🔍 Generated Mermaid diagram:', result);
  return result;
};

const transformAnalysisData = (data: any): AnalysisResponse => {
  // Create a map to store all components by name for easy lookup
  const componentMap = new Map<string, ComponentAnalysis>();

  // Transform functions first
  const functionComponents: ComponentAnalysis[] = data.codeOutput.functions.map((func: CodeFunction) => {
    const component: ComponentAnalysis = {
    type: 'function',
    name: func.name,
    description: func.documentation || `Function ${func.name}`,
      implementation: func.codeSnippet || 'Implementation not available',
    usage: func.documentation || 'Usage information not available',
      parameters: func.parameters.map((p: Parameter) => ({
      name: p.name,
      type: p.type,
      description: `Parameter ${p.name} of type ${p.type}`
    })),
    returns: func.returnType ? {
      type: func.returnType,
      description: `Returns ${func.returnType}`
    } : undefined,
    relationships: {
      dependencies: [],
        dependents: [],
        outputs: func.returnType ? [{
          name: 'return',
          type: func.returnType,
          description: `Returns ${func.returnType}`
        }] : []
      } as ComponentRelationships
    };
    componentMap.set(func.name, component);
    return component;
  });

  // Transform classes with their methods
  const classComponents: ComponentAnalysis[] = data.codeOutput.classes.map((cls: CodeClass) => {
    const component: ComponentAnalysis = {
    type: 'class',
    name: cls.name,
    description: cls.documentation || `Class ${cls.name}`,
      implementation: cls.methods.map((m: Method) => m.name).join('\n\n') || 'Implementation not available',
    usage: cls.documentation || 'Usage information not available',
    parameters: [],
    relationships: {
        dependencies: cls.methods.map((method: Method) => ({
        name: method.name,
          type: method.type || 'function_call' as RelationshipType,
        description: method.documentation || `Method ${method.name}`
        })),
        dependents: [],
        outputs: cls.methods.filter(m => m.type === 'event_handler').map(m => ({
          name: m.name,
          type: 'event',
          description: `Event handler ${m.name}`
        }))
      } as ComponentRelationships
    };
    componentMap.set(cls.name, component);
    return component;
  });

  // Update relationships based on function calls
  data.codeOutput.functions.forEach((func: CodeFunction) => {
    const functionCalls = Array.from(func.codeSnippet.matchAll(/\b(\w+)\(/g))
      .map((match: RegExpMatchArray) => match[1])
      .filter(name => componentMap.has(name));

    // Add dependencies to the calling function
    const callingComponent = componentMap.get(func.name);
    if (callingComponent?.relationships) {
      callingComponent.relationships.dependencies.push(...functionCalls.map(calledFunc => ({
        name: calledFunc,
        type: 'function_call' as RelationshipType,
        description: `Calls function ${calledFunc}`
      })));
    }

    // Add dependents to the called functions
    functionCalls.forEach(calledFunc => {
      const calledComponent = componentMap.get(calledFunc);
      if (calledComponent?.relationships?.dependents) {
        calledComponent.relationships.dependents.push({
          name: func.name,
          type: 'function_call' as RelationshipType,
          description: `Called by function ${func.name}`
        });
      }
    });
  });

  // Update class-method relationships
  data.codeOutput.classes.forEach((cls: CodeClass) => {
    const classComponent = componentMap.get(cls.name);
    if (!classComponent) return;

    cls.methods.forEach((method: Method) => {
      const methodComponent = componentMap.get(method.name);
      if (methodComponent?.relationships?.dependents) {
        // Add class as a dependent to the method
        methodComponent.relationships.dependents.push({
          name: cls.name,
          type: 'class' as RelationshipType,
          description: `Member of class ${cls.name}`
        });
      }
    });
  });

  // Build dependency graph nodes
  const nodes = [...functionComponents, ...classComponents].map(comp => ({
    id: comp.name,
    type: comp.type,
    description: comp.description
  }));

  // Build dependency graph edges by analyzing code relationships
  const edges: Array<{from: string; to: string; type: RelationshipType; description: string}> = [];
  
  // Add class-method relationships
  data.codeOutput.classes.forEach((cls: CodeClass) => {
    cls.methods.forEach((method: Method) => {
      edges.push({
        from: cls.name,
        to: method.name,
        type: 'function_call' as RelationshipType,
        description: `Class ${cls.name} contains method ${method.name}`
      });
    });
  });

  // Add function call relationships (basic static analysis)
  data.codeOutput.functions.forEach((func: CodeFunction) => {
    // Look for function calls in the implementation
    const functionCalls = Array.from(func.codeSnippet.matchAll(/\b(\w+)\(/g))
      .map((match: RegExpMatchArray) => match[1])
      .filter(name => componentMap.has(name));

    functionCalls.forEach(calledFunc => {
      edges.push({
        from: func.name,
        to: calledFunc,
        type: 'function_call' as RelationshipType,
        description: `${func.name} calls ${calledFunc}`
      });
    });
  });

  // Generate system overview
  const mainComponents = [...new Set([
    ...data.codeOutput.classes.map((cls: CodeClass) => cls.name),
    ...data.codeOutput.functions.filter((func: CodeFunction) => 
      // Only include top-level functions (not methods)
      !edges.some(edge => edge.to === func.name && edge.type === 'function_call')
    ).map((func: CodeFunction) => func.name)
  ])];

  // Analyze the architecture based on the components and their relationships
  const architecturePatterns = [];
  if (data.codeOutput.classes.length > 0) {
    architecturePatterns.push('Object-Oriented');
  }
  if (edges.some(edge => edge.type === 'event_handler')) {
    architecturePatterns.push('Event-Driven');
  }
  if (mainComponents.some(comp => comp.toLowerCase().includes('service'))) {
    architecturePatterns.push('Service-Based');
  }

  // Analyze the tech stack based on code patterns
  const techStack = new Set<string>();
  const codebase = data.codeOutput.functions.map((f: CodeFunction) => f.codeSnippet).join('\n');
  
  // Detect common patterns
  if (codebase.includes('React')) techStack.add('React');
  if (codebase.includes('useState') || codebase.includes('useEffect')) techStack.add('React Hooks');
  if (codebase.includes('createCanvas')) techStack.add('p5.js');
  if (codebase.includes('getAudioContext')) techStack.add('Web Audio API');
  if (codebase.includes('analyser')) techStack.add('Audio Analysis');

  // Generate data flow description
  const dataFlowPatterns = [];
  if (edges.length > 0) {
    const functionCalls = edges.filter(e => e.type === 'function_call');
    const eventHandlers = edges.filter(e => e.type === 'event_handler');
    
    if (functionCalls.length > 0) {
      dataFlowPatterns.push('Function call-based data flow');
    }
    if (eventHandlers.length > 0) {
      dataFlowPatterns.push('Event-driven data flow');
    }
  }

  return {
    codeOutput: data.codeOutput,
    aiAnalysis: {
      overview: {
        description: `System with ${mainComponents.length} main components`,
        architecture: architecturePatterns.length > 0 
          ? architecturePatterns.join('/')
          : 'Modular Architecture',
        mainComponents: mainComponents,
        dataFlow: dataFlowPatterns.length > 0 
          ? dataFlowPatterns.join(', ') 
          : 'Sequential data flow through component hierarchy',
        technicalStack: Array.from(techStack)
      },
      components: [...functionComponents, ...classComponents],
      dependencies: {
        nodes,
        edges
      }
    }
  };
};

export const CodeAnalyzer: React.FC = () => {
  // Group all hooks at the top
  const [folder, setFolder] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null)
  const [useCachedData, setUseCachedData] = useState(false)
  
  // Group all Chakra hooks together
  const toast = useToast()
  const bgColor = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const codeBgColor = useColorModeValue('white', 'gray.800')
  const theme = useColorModeValue('default', 'dark')

  // Add more detailed debug logging
  useEffect(() => {
    if (analysisData) {
      console.log('🔍 DEBUG: Full analysis data structure:', {
        hasCodeOutput: !!analysisData.codeOutput,
        hasAiAnalysis: !!analysisData.aiAnalysis,
        overview: analysisData.aiAnalysis?.overview,
        componentsCount: analysisData.aiAnalysis?.components?.length,
        functionsCount: analysisData.codeOutput?.functions?.length,
        classesCount: analysisData.codeOutput?.classes?.length,
        dependencies: {
          nodesCount: analysisData.aiAnalysis?.dependencies?.nodes?.length,
          edgesCount: analysisData.aiAnalysis?.dependencies?.edges?.length
        }
      });
      
      // Check if overview exists and has required fields
      if (analysisData.aiAnalysis?.overview) {
        console.log('🔍 DEBUG: Overview structure:', {
          hasDescription: !!analysisData.aiAnalysis.overview.description,
          hasArchitecture: !!analysisData.aiAnalysis.overview.architecture,
          hasMainComponents: Array.isArray(analysisData.aiAnalysis.overview.mainComponents),
          hasDataFlow: !!analysisData.aiAnalysis.overview.dataFlow,
          hasTechStack: Array.isArray(analysisData.aiAnalysis.overview.technicalStack)
        });
      }
      
      // Check components structure
      if (analysisData.aiAnalysis?.components) {
        console.log('🔍 DEBUG: First component structure:', 
          analysisData.aiAnalysis.components[0] || 'No components'
        );
      }
    }
  }, [analysisData]);

  // Load cached data on component mount
  useEffect(() => {
    const cachedData = localStorage.getItem('lastAnalysis')
    const cachedFolder = localStorage.getItem('lastAnalyzedFolder')
    if (cachedData && cachedFolder) {
      const parsedData = JSON.parse(cachedData)
      console.log('🔍 Loading cached data:', parsedData)
      console.log('📊 Raw cached data validation:', validateAnalysisResponse(parsedData))
      
      // Transform the cached data
      const transformedData = transformAnalysisData(parsedData);
      console.log('🔄 Transformed cached data:', transformedData);
      console.log('📊 Overview after transform:', transformedData.aiAnalysis.overview);
      
      setAnalysisData(transformedData)
      setFolder(cachedFolder)
      setUseCachedData(true)
      toast({
        title: 'Cached Data Loaded',
        description: `Loaded analysis for ${cachedFolder}`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
    } else {
      console.log('❌ No cached data found')
    }
  }, [])

  // Add effect to track analysisData changes
  useEffect(() => {
    console.log('🔄 Analysis data updated:', analysisData)
    if (analysisData) {
      console.log('📊 Current data validation:', validateAnalysisResponse(analysisData))
      console.log('📊 Overview:', safeObject(analysisData.aiAnalysis.overview))
      console.log('📊 Components:', safeArray(analysisData.aiAnalysis.components).length)
      console.log('📊 Dependencies:', safeObject(analysisData.aiAnalysis.dependencies))
    }
  }, [analysisData])

  const runAnalysis = async () => {
    if (!folder.trim()) {
      toast({
        title: 'No folder provided',
        description: 'Please enter a folder path to analyze.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (useCachedData) {
      const cachedData = localStorage.getItem('lastAnalysis')
      const cachedFolder = localStorage.getItem('lastAnalyzedFolder')
      
      if (!cachedData || !cachedFolder) {
        toast({
          title: 'No cached data available',
          description: 'Please disable "Use cached data" to perform a new analysis.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        })
        return
      }

      if (cachedFolder !== folder) {
        toast({
          title: 'Different folder selected',
          description: 'Please disable "Use cached data" to analyze a different folder.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        })
        return
      }

      const parsedData = JSON.parse(cachedData)
      console.log('🔄 Using cached data:', parsedData)
      
      // Transform the cached data before setting it
      const transformedData = transformAnalysisData(parsedData);
      console.log('🔄 Transformed cached data:', transformedData);
      console.log('📊 Overview after transform:', transformedData.aiAnalysis.overview);
      
      setAnalysisData(transformedData)
      toast({
        title: 'Using Cached Data',
        description: `Loaded cached analysis for ${folder}`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    console.log('🔍 Starting analysis for folder:', folder)
    setLoading(true)
    
    try {
      const response = await axios.post<AnalysisResponse>('http://localhost:3000/api/analyze', {
        folder
      });
      
      console.log('📥 Raw API response:', response.data);
      
      // Transform the data
      const transformedData = transformAnalysisData(response.data);
      console.log('🔄 Transformed data:', transformedData);
      
      // Validate the transformed data
      const validationResult = validateAnalysisResponse(transformedData);
      if (!validationResult.isValid) {
        console.error('❌ Invalid response structure:', validationResult.errors);
        throw new Error(`Invalid response structure: ${validationResult.errors.join(', ')}`);
      }
      
      // Save the transformed data
      localStorage.setItem('lastAnalysis', JSON.stringify(transformedData));
      localStorage.setItem('lastAnalyzedFolder', folder);
      
      setAnalysisData(transformedData);
      
      toast({
        title: 'Analysis complete',
        description: `Analyzed ${transformedData.codeOutput.functions.length} functions and ${transformedData.codeOutput.classes.length} classes`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('❌ Analysis error:', error)
      toast({
        title: 'Error running analysis',
        description: error.response?.data?.error || error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
      console.log('✅ Analysis process completed')
    }
  }

  // Add validation helper
  const validateAnalysisResponse = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!data.codeOutput) errors.push('Missing codeOutput');
    if (!data.aiAnalysis) errors.push('Missing aiAnalysis');
    
    if (data.codeOutput) {
      if (!Array.isArray(data.codeOutput.functions)) errors.push('codeOutput.functions is not an array');
      if (!Array.isArray(data.codeOutput.classes)) errors.push('codeOutput.classes is not an array');
    }
    
    if (data.aiAnalysis) {
      if (!data.aiAnalysis.overview) errors.push('Missing aiAnalysis.overview');
      if (!Array.isArray(data.aiAnalysis.components)) errors.push('aiAnalysis.components is not an array');
      if (!data.aiAnalysis.dependencies) errors.push('Missing aiAnalysis.dependencies');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  const renderAnalysisPanel = (analysis: ComponentAnalysis | undefined) => {
    console.log('🎯 DEBUG: Rendering analysis panel for:', analysis?.name);
    console.log('🎯 DEBUG: Analysis panel data:', {
      type: analysis?.type,
      hasDescription: !!analysis?.description,
      hasImplementation: !!analysis?.implementation,
      hasUsage: !!analysis?.usage,
      parametersCount: analysis?.parameters?.length,
      hasReturns: !!analysis?.returns,
      hasRelationships: !!analysis?.relationships
    });

    if (!analysis) {
      console.log('⚠️ DEBUG: No analysis data provided to renderAnalysisPanel');
      return null;
    }

    return (
      <Box p={4} bg={bgColor} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
        <VStack align="stretch" spacing={4}>
          <HStack>
            <Badge colorScheme={analysis.type === 'class' ? 'purple' : 'blue'}>
              {analysis.type}
            </Badge>
            <Heading size="md">{analysis.name}</Heading>
          </HStack>
          
          <Text>{analysis.description}</Text>
          
          <Box>
            <Heading size="sm" mb={2}>Implementation</Heading>
            <Box 
              borderRadius="md" 
              maxW="100%" 
              sx={{
                '& pre': {
                  whiteSpace: 'pre-wrap !important',
                  wordBreak: 'break-all !important',
                  overflowWrap: 'break-word !important'
                }
              }}
            >
              <SyntaxHighlighter
                language="typescript"
                style={tomorrow}
                customStyle={{ 
                  margin: 0, 
                  borderRadius: '0.375rem'
                }}
              >
                {analysis.implementation}
              </SyntaxHighlighter>
            </Box>
          </Box>
          
          <Box>
            <Heading size="sm" mb={2}>Usage</Heading>
            <Text>{analysis.usage}</Text>
          </Box>
          
          {analysis.parameters && analysis.parameters.length > 0 && (
            <Box>
              <Heading size="sm" mb={2}>Parameters</Heading>
              <VStack align="stretch">
                {analysis.parameters.map((param, index) => (
                  <Box key={`${analysis.name}-param-${index}`} p={2} bg={codeBgColor} borderRadius="md">
                    <Text fontWeight="bold">{param.name}: {param.type}</Text>
                    <Text>{param.description}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
          
          {analysis.returns && (
            <Box>
              <Heading size="sm" mb={2}>Returns</Heading>
              <Box p={2} bg={codeBgColor} borderRadius="md">
                <Text fontWeight="bold">{analysis.returns.type}</Text>
                <Text>{analysis.returns.description}</Text>
              </Box>
            </Box>
          )}

          {analysis.relationships && (
            <RelationshipVisualizer analysis={analysis} />
          )}
        </VStack>
      </Box>
    );
  };

  // Add debug output in render
  console.log('🎨 Rendering with analysisData:', analysisData)

  return (
    <Container maxW="container.xl">
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={4}>Code Analyzer</Heading>
          <Text mb={4}>Enter the full folder path to analyze and generate documentation.</Text>
          
          <Flex gap={4} mb={4}>
            <Input 
              placeholder='Enter full folder path (e.g., C:\path\to\folder)' 
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            />
            <Button
              colorScheme="green"
              onClick={runAnalysis}
              isLoading={loading}
              loadingText="Analyzing..."
              disabled={loading || !folder.trim()}
              _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
            >
              Run Analysis
            </Button>
          </Flex>

          <Flex align="center" mb={4}>
            <Switch
              id="use-cached"
              isChecked={useCachedData}
              onChange={(e) => setUseCachedData(e.target.checked)}
              mr={2}
            />
            <FormLabel htmlFor="use-cached" mb={0}>
              Use cached data when available
            </FormLabel>
            <Text fontSize="sm" color="gray.500" ml={2}>
              ({useCachedData ? "Using cached data only - disable to analyze new folders" : "Will analyze folder using API"})
            </Text>
          </Flex>

          {useCachedData && (
            <Accordion allowToggle mb={4}>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      <Text fontWeight="medium">View Raw Cached Data</Text>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4} maxH="500px" overflowY="auto">
                  <Box>
                    <Heading size="sm" mb={2}>Last Analyzed Folder</Heading>
                    <Code p={2} borderRadius="md" display="block" mb={4}>
                      {localStorage.getItem('lastAnalyzedFolder') || 'No folder cached'}
                    </Code>
                    
                    <Heading size="sm" mb={2}>Cached Analysis Data</Heading>
                    <Box position="relative">
                      <Button
                        size="sm"
                        position="absolute"
                        right="1"
                        top="1"
                        onClick={() => {
                          const cachedData = localStorage.getItem('lastAnalysis');
                          if (cachedData) {
                            navigator.clipboard.writeText(cachedData);
                            toast({
                              title: 'Copied to clipboard',
                              status: 'success',
                              duration: 2000,
                            });
                          }
                        }}
                      >
                        Copy
                      </Button>
                      <SyntaxHighlighter
                        language="json"
                        style={tomorrow}
                        customStyle={{
                          maxHeight: '400px',
                          overflow: 'auto',
                          padding: '1rem',
                          borderRadius: '0.375rem',
                          marginTop: '0.5rem'
                        }}
                      >
                        {JSON.stringify(JSON.parse(localStorage.getItem('lastAnalysis') || '{}'), null, 2)}
                      </SyntaxHighlighter>
                    </Box>
                  </Box>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}

          {folder && (
            <Text fontSize="sm" color="gray.600" mb={4}>
              Selected folder: {folder}
            </Text>
          )}
        </Box>

        {analysisData && (
          <VStack spacing={6} align="stretch">
            {/* Overview Section */}
            <Box>
              <Heading size="md" mb={4}>System Overview</Heading>
              <VStack align="stretch" spacing={4} p={4} bg={bgColor} borderRadius="md" borderWidth="1px">
                <Text><strong>Description:</strong> {safeObject(analysisData.aiAnalysis.overview).description || 'No description available'}</Text>
                <Text><strong>Architecture:</strong> {safeObject(analysisData.aiAnalysis.overview).architecture || 'No architecture details available'}</Text>
                <Box>
                  <Text fontWeight="bold">Main Components:</Text>
                  <UnorderedList>
                    {safeArray(safeObject(analysisData.aiAnalysis.overview).mainComponents).map((comp, i) => (
                      <ListItem key={i}>{comp}</ListItem>
                    ))}
                  </UnorderedList>
                </Box>
                <Text><strong>Data Flow:</strong> {safeObject(analysisData.aiAnalysis.overview).dataFlow || 'No data flow information available'}</Text>
                <Box>
                  <Text fontWeight="bold">Tech Stack:</Text>
                  <Wrap>
                    {safeArray(safeObject(analysisData.aiAnalysis.overview).technicalStack).map((tech, i) => (
                      <WrapItem key={i}>
                        <Badge colorScheme="blue">{tech}</Badge>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              </VStack>
            </Box>

            {/* Components Analysis */}
            <Box>
              <Heading size="md" mb={4}>Components</Heading>
              <SimpleGrid columns={[1, null, 2]} spacing={6}>
                {safeArray(analysisData.aiAnalysis.components).map((component, index) => (
                  <Box key={index}>
                    {renderAnalysisPanel(component)}
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            {/* Dependencies Graph */}
            <Box>
              <Heading size="md" mb={4}>Dependencies</Heading>
              <Box p={4} bg={bgColor} borderRadius="md" borderWidth="1px">
                <MermaidDiagram
                  chart={generateDependencyDiagram(safeObject(analysisData?.aiAnalysis)?.dependencies)}
                  config={{
                    theme,
                    flowchart: {
                      curve: 'monotoneX',
                      padding: 20
                    }
                  }}
                />
              </Box>
            </Box>
          </VStack>
        )}
      </VStack>
    </Container>
  )
}

export default CodeAnalyzer 