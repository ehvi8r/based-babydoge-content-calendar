import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Play, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

const TeamSystemTest = () => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const targetEmails = ['geminikandrew@gmail.com', 'popcatsr@gmail.com', 'robearncash@gmail.com'];

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);
    const results: TestResult[] = [];

    try {
      // Test 1: Check if target users exist in auth.users
      results.push({ name: 'Checking Auth Users', status: 'pending', message: 'Verifying user accounts...' });
      setTestResults([...results]);

      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .in('email', targetEmails);

      if (profilesError) {
        results[results.length - 1] = {
          name: 'Checking Auth Users',
          status: 'error',
          message: 'Failed to check user profiles',
          details: profilesError.message
        };
      } else {
        const foundEmails = profilesData?.map(p => p.email) || [];
        const missingEmails = targetEmails.filter(email => !foundEmails.includes(email));
        
        if (missingEmails.length === 0) {
          results[results.length - 1] = {
            name: 'Checking Auth Users',
            status: 'success',
            message: 'All 3 target users found in database',
            details: `Found: ${foundEmails.join(', ')}`
          };
        } else {
          results[results.length - 1] = {
            name: 'Checking Auth Users',
            status: 'warning',
            message: `${missingEmails.length} users missing`,
            details: `Missing: ${missingEmails.join(', ')}`
          };
        }
      }
      setTestResults([...results]);

      // Test 2: Check user roles
      results.push({ name: 'Checking User Roles', status: 'pending', message: 'Verifying role assignments...' });
      setTestResults([...results]);

      if (profilesData && profilesData.length > 0) {
        const userIds = profilesData.map(p => p.id);
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        if (rolesError) {
          results[results.length - 1] = {
            name: 'Checking User Roles',
            status: 'error',
            message: 'Failed to check user roles',
            details: rolesError.message
          };
        } else {
          const usersWithRoles = rolesData?.length || 0;
          const expectedUsers = profilesData.length;
          
          if (usersWithRoles === expectedUsers) {
            const rolesSummary = rolesData?.map(r => r.role).join(', ') || '';
            results[results.length - 1] = {
              name: 'Checking User Roles',
              status: 'success',
              message: 'All users have assigned roles',
              details: `Roles: ${rolesSummary}`
            };
          } else {
            results[results.length - 1] = {
              name: 'Checking User Roles',
              status: 'warning',
              message: `${usersWithRoles}/${expectedUsers} users have roles`,
              details: 'Some users may be missing role assignments'
            };
          }
        }
      } else {
        results[results.length - 1] = {
          name: 'Checking User Roles',
          status: 'warning',
          message: 'No users to check roles for',
          details: 'Users must be created first'
        };
      }
      setTestResults([...results]);

      // Test 3: Check for pending invitations
      results.push({ name: 'Checking Pending Invitations', status: 'pending', message: 'Looking for pending invitations...' });
      setTestResults([...results]);

      const { data: invitationsData, error: invitationsError } = await supabase
        .from('team_invitations')
        .select('email, expires_at, accepted_at')
        .in('email', targetEmails)
        .is('accepted_at', null);

      if (invitationsError) {
        results[results.length - 1] = {
          name: 'Checking Pending Invitations',
          status: 'error',
          message: 'Failed to check invitations',
          details: invitationsError.message
        };
      } else {
        const pendingCount = invitationsData?.length || 0;
        if (pendingCount === 0) {
          results[results.length - 1] = {
            name: 'Checking Pending Invitations',
            status: 'success',
            message: 'No pending invitations (good - users should be created directly)',
            details: 'Clean state for direct user creation'
          };
        } else {
          const pendingEmails = invitationsData?.map(i => i.email).join(', ') || '';
          results[results.length - 1] = {
            name: 'Checking Pending Invitations',
            status: 'warning',
            message: `${pendingCount} pending invitations found`,
            details: `Consider cleaning up: ${pendingEmails}`
          };
        }
      }
      setTestResults([...results]);

      // Test 4: Check team management system functionality
      results.push({ name: 'Team Management Load Test', status: 'pending', message: 'Testing team data loading...' });
      setTestResults([...results]);

      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: true });

      if (allProfilesError) {
        results[results.length - 1] = {
          name: 'Team Management Load Test',
          status: 'error',
          message: 'Failed to load team data',
          details: allProfilesError.message
        };
      } else {
        const totalUsers = allProfiles?.length || 0;
        results[results.length - 1] = {
          name: 'Team Management Load Test',
          status: 'success',
          message: `Successfully loaded ${totalUsers} users`,
          details: `Team management system operational`
        };
      }
      setTestResults([...results]);

      // Test 5: Authentication system check
      results.push({ name: 'Authentication System', status: 'pending', message: 'Checking auth configuration...' });
      setTestResults([...results]);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        results[results.length - 1] = {
          name: 'Authentication System',
          status: 'error',
          message: 'Auth system error',
          details: authError.message
        };
      } else if (user) {
        results[results.length - 1] = {
          name: 'Authentication System',
          status: 'success',
          message: 'Authentication system working',
          details: `Current user: ${user.email}`
        };
      } else {
        results[results.length - 1] = {
          name: 'Authentication System',
          status: 'warning',
          message: 'No authenticated user',
          details: 'Test requires admin user'
        };
      }

      // Summary
      const successCount = results.filter(r => r.status === 'success').length;
      const warningCount = results.filter(r => r.status === 'warning').length;
      const errorCount = results.filter(r => r.status === 'error').length;

      if (errorCount > 0) {
        toast({
          title: "Tests Completed with Errors",
          description: `${successCount} passed, ${warningCount} warnings, ${errorCount} errors`,
          variant: "destructive",
        });
      } else if (warningCount > 0) {
        toast({
          title: "Tests Completed with Warnings",
          description: `${successCount} passed, ${warningCount} warnings`,
        });
      } else {
        toast({
          title: "All Tests Passed!",
          description: `${successCount} tests completed successfully`,
        });
      }

    } catch (error) {
      console.error('Testing error:', error);
      toast({
        title: "Test Error",
        description: "An unexpected error occurred during testing",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'error':
        return <XCircle size={16} className="text-red-400" />;
      case 'warning':
        return <AlertCircle size={16} className="text-yellow-400" />;
      default:
        return <RefreshCw size={16} className="text-blue-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-500/30 bg-green-900/20';
      case 'error':
        return 'border-red-500/30 bg-red-900/20';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-900/20';
      default:
        return 'border-blue-500/30 bg-blue-900/20';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Play size={20} />
          Team System Testing
          <Badge variant="secondary" className="bg-purple-600 text-white">
            Diagnostic Tool
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Button
            onClick={runTests}
            disabled={testing}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {testing ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play size={16} className="mr-2" />
                Run System Tests
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2 p-4 bg-slate-700/30 rounded-lg">
          <h3 className="text-slate-300 font-medium">Target Users for Testing:</h3>
          <div className="text-xs text-slate-400 space-y-1">
            {targetEmails.map(email => (
              <div key={email}>• {email}</div>
            ))}
          </div>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-white font-medium">Test Results</h3>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className={`rounded-lg p-3 border ${getStatusColor(result.status)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(result.status)}
                    <span className="text-white font-medium">{result.name}</span>
                  </div>
                  <div className="text-sm text-slate-300 ml-6">
                    {result.message}
                  </div>
                  {result.details && (
                    <div className="text-xs text-slate-400 ml-6 mt-1">
                      {result.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h4 className="text-blue-300 font-medium mb-2">Testing Instructions:</h4>
          <div className="text-xs text-blue-200 space-y-1">
            <div>1. First, use the "Create Users" tab to create the 3 target accounts</div>
            <div>2. Run these tests to verify everything is working</div>
            <div>3. Share the login credentials with the users securely</div>
            <div>4. Have users test login and calendar access</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamSystemTest;
