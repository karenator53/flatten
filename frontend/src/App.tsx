import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import CodeAnalyzer from './components/CodeAnalyzer.tsx'
import Documentation from './components/Documentation'

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Navbar />
        <main style={{ padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<CodeAnalyzer />} />
            <Route path="/docs" element={<Documentation />} />
          </Routes>
        </main>
      </Router>
    </ChakraProvider>
  )
}

export default App 