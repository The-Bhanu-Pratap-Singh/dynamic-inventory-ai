import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Brain, Loader2, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const AIInsights = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<Array<{ type: 'user' | 'assistant', message: string }>>([]);

  const exampleQueries = [
    "Show dead stock from last 90 days",
    "Which product category gives highest profit?",
    "Generate reorder plan for next 30 days",
    "Which items will expire soon?",
    "Show low stock alerts"
  ];

  const handleQuery = async (queryText?: string) => {
    const currentQuery = queryText || query;
    
    if (!currentQuery.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a question or select an example.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setConversation(prev => [...prev, { type: 'user', message: currentQuery }]);
    setQuery("");

    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: { query: currentQuery }
      });

      if (error) throw error;

      setConversation(prev => [...prev, { type: 'assistant', message: data.answer }]);
    } catch (error: any) {
      toast({
        title: "Query Failed",
        description: error.message || "Failed to process your query",
        variant: "destructive",
      });
      setConversation(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Insight Center</h1>
                <p className="text-xs text-muted-foreground">Ask anything about your inventory</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Low Stock</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Categories</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Ask AI Assistant</CardTitle>
              <CardDescription>Get insights about your inventory, sales, and forecasts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Conversation History */}
              {conversation.length > 0 && (
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-4">
                    {conversation.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Example Queries */}
              {conversation.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Try these example queries:</p>
                  <div className="flex flex-wrap gap-2">
                    {exampleQueries.map((example, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuery(example)}
                        disabled={loading}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Ask a question about your inventory..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                  disabled={loading}
                />
                <Button onClick={() => handleQuery()} disabled={loading || !query.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Ask"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AIInsights;
