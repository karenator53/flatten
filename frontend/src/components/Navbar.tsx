import { Box, Container, Flex, Button, Heading } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

const Navbar = () => {
  return (
    <Box bg="blue.500" color="white" py={4} mb={8}>
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center">
          <Heading size="md">Code Doc Generator</Heading>
          <Flex gap={6}>
            <Button
              as={RouterLink}
              to="/"
              variant="ghost"
              color="white"
              _hover={{ bg: 'blue.600' }}
            >
              Analyzer
            </Button>
            <Button
              as={RouterLink}
              to="/docs"
              variant="ghost"
              color="white"
              _hover={{ bg: 'blue.600' }}
            >
              Documentation
            </Button>
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}

export default Navbar 