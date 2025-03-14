import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { format, isAfter, addMinutes } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface TokenInfo {
  manager: string;
  status: 'valid' | 'expiring' | 'expired' | 'unknown';
  expiryTime?: Date;
  lastRefreshed?: Date;
}

interface TokenManagementProps {
  tokens: TokenInfo[];
  onRefresh: (manager: string) => Promise<void>;
  isLoading?: boolean;
}

export default function TokenManagement({
  tokens,
  onRefresh,
  isLoading = false,
}: TokenManagementProps) {
  const { toast } = useToast();
  const [refreshingTokens, setRefreshingTokens] = useState<Record<string, boolean>>({});

  // Calculate remaining time in minutes
  const getRemainingTime = (expiryTime?: Date): number => {
    if (!expiryTime) return 0;
    const now = new Date();
    const diffMs = expiryTime.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  };

  // Get status label and color
  const getStatusInfo = (status: TokenInfo['status']) => {
    switch (status) {
      case 'valid':
        return { 
          label: 'Valid', 
          icon: <CheckCircle className="h-4 w-4 mr-1" />,
          variant: 'default' as const,
          className: 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
        };
      case 'expiring':
        return { 
          label: 'Expiring Soon', 
          icon: <AlertTriangle className="h-4 w-4 mr-1" />,
          variant: 'outline' as const,
          className: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
        };
      case 'expired':
        return { 
          label: 'Expired', 
          icon: <XCircle className="h-4 w-4 mr-1" />,
          variant: 'destructive' as const
        };
      default:
        return { 
          label: 'Unknown', 
          icon: <AlertTriangle className="h-4 w-4 mr-1" />,
          variant: 'outline' as const
        };
    }
  };

  // Handle token refresh
  const handleRefreshToken = async (manager: string) => {
    try {
      setRefreshingTokens(prev => ({ ...prev, [manager]: true }));
      await onRefresh(manager);
      toast({
        title: "Token refreshed",
        description: `${manager}'s token has been refreshed successfully.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: `Failed to refresh token for ${manager}.`,
      });
      console.error(`Error refreshing token for ${manager}:`, error);
    } finally {
      setRefreshingTokens(prev => ({ ...prev, [manager]: false }));
    }
  };

  // Handle refresh all tokens
  const handleRefreshAllTokens = async () => {
    try {
      const refreshAllPromises = tokens.map(token => handleRefreshToken(token.manager));
      await Promise.all(refreshAllPromises);
      toast({
        title: "All tokens refreshed",
        description: "All manager tokens have been refreshed successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "Failed to refresh all tokens.",
      });
      console.error("Error refreshing all tokens:", error);
    }
  };

  const getRefreshWarning = (token: TokenInfo) => {
    if (token.status === 'valid' && token.expiryTime) {
      const remainingMins = getRemainingTime(token.expiryTime);
      return remainingMins <= 5 
        ? "Token will expire soon. Consider refreshing." 
        : null;
    }
    return token.status === 'expired' 
      ? "Token has expired. Refresh required."
      : token.status === 'expiring'
        ? "Token will expire soon. Consider refreshing."
        : null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">API Token Management</CardTitle>
          <CardDescription>Loading token information...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">747 Casino API Tokens</CardTitle>
            <CardDescription>Manage authentication tokens for top managers</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefreshAllTokens}
            disabled={Object.values(refreshingTokens).some(v => v)}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${
              Object.values(refreshingTokens).some(v => v) ? 'animate-spin' : ''
            }`} />
            Refresh All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tokens.map((token, index) => {
            const { label, icon, variant } = getStatusInfo(token.status);
            const warning = getRefreshWarning(token);
            const remainingTime = token.expiryTime ? getRemainingTime(token.expiryTime) : null;
            
            return (
              <div key={token.manager} className="space-y-2">
                {index > 0 && <Separator />}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{token.manager}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={variant} className={getStatusInfo(token.status).className}>
                          {icon} {label}
                        </Badge>
                        
                        {remainingTime !== null && (
                          <span className="text-sm text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {remainingTime} min remaining
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={refreshingTokens[token.manager]}
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${
                            refreshingTokens[token.manager] ? 'animate-spin' : ''
                          }`} />
                          Refresh
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Refresh Token for {token.manager}</DialogTitle>
                          <DialogDescription>
                            This will refresh the API token for {token.manager}. The current token
                            {token.expiryTime && (
                              <>
                                {" "}expires at {format(token.expiryTime, "h:mm a, MMM d, yyyy")}
                                {" "}({getRemainingTime(token.expiryTime)} minutes remaining)
                              </>
                            )}.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => handleRefreshToken(token.manager)}
                            disabled={refreshingTokens[token.manager]}
                          >
                            {refreshingTokens[token.manager] && (
                              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            )}
                            Confirm Refresh
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {warning && (
                    <div className="bg-warning/10 text-warning-foreground p-2 rounded-md text-sm flex items-center mt-2">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {warning}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-sm">
                    <div className="text-muted-foreground">Last refreshed:</div>
                    <div>
                      {token.lastRefreshed 
                        ? format(token.lastRefreshed, "h:mm a, MMM d, yyyy")
                        : "Never"}
                    </div>
                    
                    {token.expiryTime && (
                      <>
                        <div className="text-muted-foreground">Expires at:</div>
                        <div>{format(token.expiryTime, "h:mm a, MMM d, yyyy")}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 mr-1" />
        Note: API tokens expire after 30 minutes. Refresh tokens before they expire to maintain uninterrupted service.
      </CardFooter>
    </Card>
  );
}