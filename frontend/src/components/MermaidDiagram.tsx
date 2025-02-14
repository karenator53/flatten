import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Box, Text, useColorModeValue, Code } from '@chakra-ui/react';

interface MermaidDiagramProps {
  chart: string;
  config?: any;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const errorBgColor = useColorModeValue('red.50', 'red.900');
  const codeBgColor = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    let mounted = true;
    let observer: ResizeObserver | null = null;

    const renderDiagram = async () => {
      if (!containerRef.current || !mounted) return;

      try {
        // Clear previous content and error
        containerRef.current.innerHTML = '';
        setError(null);

        // Initialize mermaid with enhanced config
        mermaid.initialize({
          startOnLoad: false,
          theme: config?.theme || 'default',
          securityLevel: 'loose',
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            nodeSpacing: 100,
            rankSpacing: 100,
            padding: 20,
            ranker: 'longest-path',
            ...config?.flowchart,
          },
          maxTextSize: 5000,
          fontSize: 14,
          fontFamily: 'arial',
          logLevel: 'error',
        });

        // Create a unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create a wrapper div with the unique ID
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid';
        wrapper.id = id;
        
        // Clean up the chart definition
        const cleanedChart = chart
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .join('\n');
        
        console.log('🔍 Cleaned chart:', cleanedChart);
        
        wrapper.textContent = cleanedChart;
        
        // Add wrapper to container
        containerRef.current.appendChild(wrapper);

        // Wait for next frame to ensure DOM is ready
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Render the diagram
        const { svg } = await mermaid.render(id, cleanedChart);
        
        if (mounted && containerRef.current) {
          // Set the SVG content
          containerRef.current.innerHTML = svg;
          
          // Wait for next frame to ensure SVG is mounted
          await new Promise(resolve => requestAnimationFrame(resolve));
          
          // Post-process the SVG with error handling
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            // Set up ResizeObserver for the SVG element
            observer = new ResizeObserver(entries => {
              if (!entries.length || !mounted) return;
              
              const entry = entries[0];
              if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                try {
                  // Set basic styles
                  svgElement.style.maxWidth = '100%';
                  svgElement.style.height = 'auto';
                  svgElement.style.minHeight = '200px';
                  
                  // Only try to set viewBox if we don't already have one
                  if (!svgElement.getAttribute('viewBox')) {
                    // Make sure the SVG is visible
                    svgElement.style.visibility = 'visible';
                    svgElement.style.display = 'block';
                    
                    try {
                      const bbox = svgElement.getBBox();
                      if (bbox && bbox.width && bbox.height) {
                        svgElement.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
                      }
                    } catch (bboxError) {
                      console.warn('Unable to set viewBox:', bboxError);
                      // Set a default viewBox if we can't calculate it
                      svgElement.setAttribute('viewBox', '0 0 800 600');
                    }
                  }
                  
                  // Disconnect observer after successful processing
                  observer?.disconnect();
                } catch (svgError) {
                  console.warn('Error processing SVG:', svgError);
                }
              }
            });
            
            observer.observe(svgElement);
          }
        }
      } catch (error: any) {
        console.warn('Failed to render Mermaid diagram:', error);
        setError(error.message || 'Failed to render diagram');
      }
    };

    // Initial render using requestAnimationFrame
    requestAnimationFrame(renderDiagram);

    return () => {
      mounted = false;
      observer?.disconnect();
    };
  }, [chart, config]);

  if (error) {
    return (
      <Box p={4} bg={errorBgColor} borderRadius="md" color="red.500">
        <Text fontWeight="bold" mb={2}>Diagram Rendering Error</Text>
        <Text mb={2}>{error}</Text>
        <Box bg={codeBgColor} p={2} borderRadius="md">
          <Code display="block" whiteSpace="pre-wrap" children={chart} />
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      ref={containerRef} 
      bg={bgColor} 
      p={4} 
      borderRadius="md" 
      overflow="auto"
      minH="200px"
      sx={{
        '.mermaid': {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          '& svg': {
            maxWidth: '100%',
            height: 'auto',
            minHeight: '200px',
          },
        },
      }}
    />
  );
};

export default MermaidDiagram; 