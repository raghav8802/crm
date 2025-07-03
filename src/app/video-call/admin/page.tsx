'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Copy, Video, Users, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VideoCallAdminPage() {
  const [generatedLinks, setGeneratedLinks] = useState<Array<{ id: string; url: string; createdAt: Date }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateVideoCallLink = async () => {
    setIsGenerating(true);
    
    // Generate a unique ID for the video call
    const callId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const videoCallUrl = `${window.location.origin}/video-call/${callId}`;
    
    const newLink = {
      id: callId,
      url: videoCallUrl,
      createdAt: new Date()
    };
    
    setGeneratedLinks(prev => [newLink, ...prev]);
    setIsGenerating(false);
    
    toast({
      title: "Video call link generated!",
      description: "The link has been copied to your clipboard.",
    });
    
    // Copy to clipboard
    navigator.clipboard.writeText(videoCallUrl);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Video call link has been copied to clipboard.",
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Video Call Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate unique video call links for customer meetings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Generate New Link Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Generate New Video Call Link
            </CardTitle>
            <CardDescription>
              Create a new video call session and share the link with your customer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={generateVideoCallLink}
              disabled={isGenerating}
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Generate Video Call Link
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Links Section */}
        {generatedLinks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Generated Video Call Links
              </CardTitle>
              <CardDescription>
                Recent video call links you've generated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedLinks.map((link) => (
                  <div 
                    key={link.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Call ID: {link.id}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {link.createdAt.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 break-all">
                        {link.url}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(link.url)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </div>
                <p>Click "Generate Video Call Link" to create a unique video call session</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </div>
                <p>Copy the generated link and share it with your customer via email, SMS, or any preferred method</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </div>
                <p>When the customer opens the link, they'll be prompted to enter their name and join the call</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                  4
                </div>
                <p>Click "Join" on your generated link to enter the video call as the admin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 