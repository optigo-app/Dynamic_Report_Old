"use client";
import React from 'react';
import { Box, Paper, Typography, Divider, Container } from '@mui/material';

export default function UnAuthorized() {
  const LockIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="16" r="1" fill="currentColor"/>
    </svg>
  );

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        bgcolor: '#F5F5F7',
        p: 3,
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: '16px', 
            overflow: 'hidden', 
            border: '1px solid #E5E5E7',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)'
            }
          }}
        >
          {/* Visual Accent */}
          <Box sx={{ height: '6px', bgcolor: '#7C3AED' }} />

          <Box sx={{ p: { xs: 6, md: 10 }, textAlign: 'center' }}>
            {/* Status Icon */}
            <Box 
              sx={{ 
                mb: 4, 
                display: 'inline-flex', 
                p: 2.5, 
                bgcolor: '#F9F9FB', 
                borderRadius: '16px', 
                color: '#7C3AED', 
                border: '1px solid #F0F0F2' 
              }}
            >
              <LockIcon />
            </Box>

            {/* Revised Professional Message */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 800, 
                  color: '#1D1D1F', 
                  letterSpacing: '-0.03em',
                  fontSize: { xs: '1.5rem', md: '1.875rem' }
                }}
              >
                Access Restricted
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#424245', 
                  lineHeight: 1.6,
                  fontWeight: 500,
                  fontSize: '1.1rem'
                }}
              >
                Your account profile does not have the administrative privileges required to access this secure module.
              </Typography>

              <Divider sx={{ width: '40px', mx: 'auto', my: 1.5, height: '2px', borderRadius: '2px', bgcolor: '#7C3AED', opacity: 0.3 }} />

              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#86868B', 
                  lineHeight: 1.7, 
                  maxWidth: '380px', 
                  mx: 'auto',
                  fontSize: '0.95rem'
                }}
              >
                This area is reserved for specific user roles. If you believe your account should have access, please initiate an authorization request through your system administrator.
              </Typography>
            </Box>
          </Box>

          {/* Compliance Footer */}
          <Box 
            sx={{ 
              bgcolor: '#FBFBFC', 
              borderTop: '1px solid #E5E5E7', 
              px: 4, 
              py: 3, 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  bgcolor: '#EF4444', 
                  borderRadius: '50%',
                  boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.1)'
                }} 
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 800, 
                  color: '#6B7280', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.1em',
                  fontSize: '0.65rem'
                }}
              >
                Error 403: Forbidden
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.8 }}>
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  bgcolor: '#1D1D1F', 
                  borderRadius: '5px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontSize: '10px', 
                  fontWeight: 900 
                }}
              >
                N
              </Box>
              <Typography 
                variant="caption" 
                sx={{ fontWeight: 700, color: '#1D1D1F', fontSize: '0.75rem' }}
              >
                System Management Gateway
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};