import { Box, Heading, Text, VStack, Flex, Tag, Container } from '@chakra-ui/react'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'

SyntaxHighlighter.registerLanguage('typescript', typescript)

const Documentation = () => {
  // This is a placeholder. In a real app, we'd fetch this from the backend
  const docs = {
    functions: [
      {
        name: 'analyzeProject',
        description: 'Analyzes a project directory and extracts code information.',
        params: [
          {
            name: 'folder',
            type: 'string',
            description: 'The path to the project folder to analyze'
          }
        ],
        returnType: 'Promise<AnalysisResult>',
        example: `const result = await analyzeProject('./my-project');
console.log(result.functions);`
      }
    ]
  }

  return (
    <Container maxW="container.xl">
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={4}>Documentation</Heading>
          <Text mb={8}>Generated documentation for your codebase.</Text>
        </Box>

        <Box>
          <Heading size="md" mb={4}>Functions</Heading>
          <VStack spacing={6} align="stretch">
            {docs.functions.map((func, index) => (
              <Box key={index} p={6} borderRadius="lg" borderWidth={1} borderColor="gray.200">
                <Flex gap={2} mb={4} align="center">
                  <Heading size="sm">{func.name}</Heading>
                  <Tag colorScheme="blue" size="sm">{func.returnType}</Tag>
                </Flex>
                
                <Text mb={4}>{func.description}</Text>
                
                <Box mb={4}>
                  <Text fontWeight="bold" mb={2}>Parameters:</Text>
                  <VStack align="stretch" pl={4}>
                    {func.params.map((param, pIndex) => (
                      <Flex key={pIndex} gap={2}>
                        <Text color="blue.500">{param.name}</Text>
                        <Text color="gray.500">({param.type})</Text>
                        <Text>- {param.description}</Text>
                      </Flex>
                    ))}
                  </VStack>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>Example:</Text>
                  <Box borderRadius="md" overflow="hidden">
                    <SyntaxHighlighter
                      language="typescript"
                      style={docco}
                      customStyle={{ margin: 0 }}
                    >
                      {func.example}
                    </SyntaxHighlighter>
                  </Box>
                </Box>
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}

export default Documentation 