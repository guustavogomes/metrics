"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicationDTO } from "@/lib/types";
import { BarChart3, ArrowRight, Mail } from "lucide-react";

interface PublicationCardProps {
  publication: PublicationDTO;
}

export function PublicationCard({ publication }: PublicationCardProps) {
  return (
    <Link href={`/publications/${publication.id}`} className="group">
      <Card className="h-full border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-slate-50 group-hover:from-white group-hover:to-blue-50">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md group-hover:shadow-lg transition-shadow">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              Newsletter
            </div>
          </div>
          
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
              {publication.name}
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-slate-600 line-clamp-2">
              {publication.description || "Newsletter do Beehiiv"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                Ver Dashboard
              </span>
            </div>
            <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
              <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            Conectado ao Beehiiv
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
