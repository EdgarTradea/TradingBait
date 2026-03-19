import React, { useState, useEffect } from "react";
import { HelpCircle, X, ExternalLink, Search } from "lucide-react";
import brain from "brain";
import { HelpArticle } from "types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ContextualHelpProps {
  topic?: string;
  title?: string;
  className?: string;
  variant?: "icon" | "button" | "inline";
  size?: "sm" | "md" | "lg";
}

interface QuickHelpProps {
  searchQuery: string;
  onArticleSelect: (articleId: string) => void;
  onViewAll: () => void;
}

const QuickHelp: React.FC<QuickHelpProps> = ({ searchQuery, onArticleSelect, onViewAll }) => {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchArticles();
    } else {
      setArticles([]);
    }
  }, [searchQuery]);

  const searchArticles = async () => {
    try {
      setIsLoading(true);
      const response = await brain.search_help_articles({
        query: searchQuery
      });
      const result = await response.json();
      setArticles(result.articles.slice(0, 5)); // Show top 5 results
    } catch (error) {
      console.error('Error searching articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!articles.length && searchQuery.trim()) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No articles found for "{searchQuery}"</p>
        <Button variant="link" onClick={onViewAll} className="mt-2">
          Browse all help articles
        </Button>
      </div>
    );
  }

  if (!searchQuery.trim()) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Type to search help articles</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {articles.map(article => (
        <div
          key={article.id}
          className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
          onClick={() => onArticleSelect(article.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{article.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {article.content.substring(0, 100)}...
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {article.category}
                </Badge>
                {article.difficulty && (
                  <Badge variant="outline" className="text-xs">
                    {article.difficulty}
                  </Badge>
                )}
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
          </div>
        </div>
      ))}
      
      {articles.length === 5 && (
        <Button variant="outline" onClick={onViewAll} className="w-full">
          View all results
        </Button>
      )}
    </div>
  );
};

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  topic = "general",
  title = "Help",
  className = "",
  variant = "icon",
  size = "md"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(topic);
  const navigate = useNavigate();

  const handleArticleSelect = (articleId: string) => {
    setIsOpen(false);
    navigate(`/help?article=${articleId}`);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery);
    }
    navigate(`/help?${params.toString()}`);
  };

  const getButtonSize = () => {
    switch (size) {
      case "sm": return "h-6 w-6";
      case "lg": return "h-8 w-8";
      default: return "h-7 w-7";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "sm": return "h-3 w-3";
      case "lg": return "h-5 w-5";
      default: return "h-4 w-4";
    }
  };

  if (variant === "inline") {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="link" className={`text-xs p-0 h-auto ${className}`}>
            <HelpCircle className="h-3 w-3 mr-1" />
            {title}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Help</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <QuickHelp 
              searchQuery={searchQuery}
              onArticleSelect={handleArticleSelect}
              onViewAll={handleViewAll}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (variant === "button") {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className={className}>
            <HelpCircle className={`${getIconSize()} mr-2`} />
            {title}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Help</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <QuickHelp 
              searchQuery={searchQuery}
              onArticleSelect={handleArticleSelect}
              onViewAll={handleViewAll}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Default icon variant
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`${getButtonSize()} ${className}`}
          title={title}
        >
          <HelpCircle className={getIconSize()} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Help</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <QuickHelp 
            searchQuery={searchQuery}
            onArticleSelect={handleArticleSelect}
            onViewAll={handleViewAll}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContextualHelp;