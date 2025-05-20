import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
          Jellyfin Admin Dashboard
        </h1>
        <p className="text-gray-400 mt-1">
          Administrator access for Jellyfin signup system
        </p>
      </div>
      
      {/* Feature Removed Message */}
      <Card className="border border-indigo-800/30 bg-indigo-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            Analytics Disabled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300">
            User analytics features have been disabled in this version.
          </p>
          <p className="text-gray-400 mt-2 text-sm">
            Use the main Jellyfin dashboard for user management.
          </p>
        </CardContent>
      </Card>
      
      {/* Redirect instruction */}
      <div className="text-center py-6">
        <a 
          href="/admin/dashboard" 
          className="text-primary hover:text-primary-light underline transition-colors"
        >
          Go to User Management Dashboard
        </a>
      </div>
    </div>
  );
}