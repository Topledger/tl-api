'use client';

import { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import Button from '@/components/UI/Button';

export default function TestApiPage() {
  const [instructionResult, setInstructionResult] = useState<any>(null);
  const [discriminatorResult, setDiscriminatorResult] = useState<any>(null);
  const [verifyIdlResult, setVerifyIdlResult] = useState<any>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const testInstructionApi = async () => {
    setLoading({ ...loading, instruction: true });
    try {
      const response = await fetch('/api/instruction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: 'sample_instruction_data',
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          network: 'mainnet-beta'
        })
      });
      const data = await response.json();
      setInstructionResult(data);
    } catch (error) {
      setInstructionResult({ error: 'Failed to call instruction API' });
    } finally {
      setLoading({ ...loading, instruction: false });
    }
  };

  const testDiscriminatorApi = async () => {
    setLoading({ ...loading, discriminator: true });
    try {
      const response = await fetch('/api/discriminator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discriminator: 'sample_discriminator',
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          network: 'mainnet-beta'
        })
      });
      const data = await response.json();
      setDiscriminatorResult(data);
    } catch (error) {
      setDiscriminatorResult({ error: 'Failed to call discriminator API' });
    } finally {
      setLoading({ ...loading, discriminator: false });
    }
  };

  const testVerifyIdlApi = async () => {
    setLoading({ ...loading, verifyIdl: true });
    try {
      const response = await fetch('/api/verify-idl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idl: { version: '0.1.0', name: 'sample_program' },
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          strict: false
        })
      });
      const data = await response.json();
      setVerifyIdlResult(data);
    } catch (error) {
      setVerifyIdlResult({ error: 'Failed to call verify-idl API' });
    } finally {
      setLoading({ ...loading, verifyIdl: false });
    }
  };

  return (
    <MainLayout title="Test Top Ledger APIs">
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Ledger API Tests</h2>
          <p className="text-gray-600 mb-6">
            Test the real Top Ledger APIs to ensure they're working correctly through our proxy endpoints.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Instruction API Test */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Instruction API</h3>
              <Button 
                variant="primary" 
                onClick={testInstructionApi}
                disabled={loading.instruction}
                className="w-full"
              >
                {loading.instruction ? 'Testing...' : 'Test Instruction API'}
              </Button>
              {instructionResult && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(instructionResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Discriminator API Test */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Discriminator API</h3>
              <Button 
                variant="primary" 
                onClick={testDiscriminatorApi}
                disabled={loading.discriminator}
                className="w-full"
              >
                {loading.discriminator ? 'Testing...' : 'Test Discriminator API'}
              </Button>
              {discriminatorResult && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(discriminatorResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Verify IDL API Test */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Verify IDL API</h3>
              <Button 
                variant="primary" 
                onClick={testVerifyIdlApi}
                disabled={loading.verifyIdl}
                className="w-full"
              >
                {loading.verifyIdl ? 'Testing...' : 'Test Verify IDL API'}
              </Button>
              {verifyIdlResult && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(verifyIdlResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">API Endpoints</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Instruction API:</strong> POST /api/instruction</p>
            <p><strong>Discriminator API:</strong> POST /api/discriminator</p>
            <p><strong>Verify IDL API:</strong> POST /api/verify-idl</p>
          </div>
          <p className="text-sm text-blue-700 mt-4">
            These endpoints proxy requests to the actual Top Ledger APIs at apis.topledger.xyz
          </p>
        </div>
      </div>
    </MainLayout>
  );
} 