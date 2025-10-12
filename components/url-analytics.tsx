"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UrlAnalytics {
  url: string;
  totalClicks: number;
  totalUniqueClicks: number;
  totalEmailClicks: number;
  totalWebClicks: number;
  totalEmailUniqueClicks: number;
  totalWebUniqueClicks: number;
  avgClickThroughRate: number;
  posts: number;
  lastSeen: string;
  domain: string;
  postTitles: string[];
}

interface DomainStats {
  domain: string;
  totalClicks: number;
  totalUniqueClicks: number;
  urlCount: number;
}

interface Publication {
  id: string;
  name: string;
  description: string | null;
}

interface UrlAnalyticsData {
  publication: Publication;
  urlAnalytics: UrlAnalytics[];
  topDomains: DomainStats[];
  summary: {
    totalUrls: number;
    totalClicks: number;
    totalUniqueClicks: number;
    totalPostsAnalyzed: number;
    avgClicksPerUrl: number;
  };
}

interface UrlAnalyticsProps {
  publicationId: string;
}

export default function UrlAnalytics({ publicationId }: UrlAnalyticsProps) {
  const [data, setData] = useState<UrlAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("urls");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/publications/${publicationId}/url-analytics`);
        
        if (!response.ok) {
          throw new Error("Erro ao carregar dados de URLs");
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [publicationId]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("pt-BR").format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getDomainIcon = (domain: string) => {
    if (domain.includes("youtube.com")) return "🎥";
    if (domain.includes("instagram.com")) return "📷";
    if (domain.includes("x.com") || domain.includes("twitter.com")) return "🐦";
    if (domain.includes("tiktok.com")) return "🎵";
    if (domain.includes("linkedin.com")) return "💼";
    if (domain.includes("facebook.com")) return "📘";
    return "🔗";
  };

  const truncateUrl = (url: string, maxLength: number = 60) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔗 Análise de URLs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando dados de URLs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔗 Análise de URLs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">❌ {error}</p>
            <Button onClick={() => window.location.reload()}>
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔗 Análise de URLs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p>Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔗 Análise de URLs - {data.publication.name}
          <Badge variant="secondary">
            {formatNumber(data.summary.totalUrls)} URLs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="urls">URLs Mais Clicadas</TabsTrigger>
            <TabsTrigger value="domains">Domínios</TabsTrigger>
          </TabsList>

          <TabsContent value="urls" className="mt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(data.summary.totalClicks)}
                  </div>
                  <div className="text-sm text-gray-600">Total de Cliques</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(data.summary.totalUniqueClicks)}
                  </div>
                  <div className="text-sm text-gray-600">Cliques Únicos</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(data.summary.avgClicksPerUrl)}
                  </div>
                  <div className="text-sm text-gray-600">Média por URL</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.summary.totalPostsAnalyzed}
                  </div>
                  <div className="text-sm text-gray-600">Posts Analisados</div>
                </div>
              </div>

              <div className="space-y-3">
                {data.urlAnalytics.slice(0, 20).map((url, index) => (
                  <div
                    key={url.url}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {getDomainIcon(url.domain)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {url.domain}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <a
                          href={url.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 break-all"
                        >
                          {truncateUrl(url.url)}
                        </a>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500 mb-2">
                        <span>📧 {formatNumber(url.totalEmailClicks)} cliques</span>
                        <span>🌐 {formatNumber(url.totalWebClicks)} cliques</span>
                        <span>📊 {url.posts} posts</span>
                        <span>📅 {formatDate(url.lastSeen)}</span>
                      </div>
                      {url.postTitles.length > 0 && (
                        <div className="text-xs text-gray-400">
                          <span className="font-medium">Posts:</span> {url.postTitles.slice(0, 2).join(", ")}
                          {url.postTitles.length > 2 && ` +${url.postTitles.length - 2} mais`}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-blue-600">
                        {formatNumber(url.totalClicks)}
                      </div>
                      <div className="text-sm text-gray-600">total</div>
                      <div className="text-sm text-green-600">
                        {formatNumber(url.totalUniqueClicks)} únicos
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="domains" className="mt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.topDomains.map((domain, index) => (
                  <div
                    key={domain.domain}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getDomainIcon(domain.domain)}
                      </span>
                      <div>
                        <div className="font-medium">{domain.domain}</div>
                        <div className="text-sm text-gray-600">
                          {domain.urlCount} URLs
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {formatNumber(domain.totalClicks)}
                      </div>
                      <div className="text-sm text-gray-600">cliques</div>
                      <div className="text-sm text-green-600">
                        {formatNumber(domain.totalUniqueClicks)} únicos
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
