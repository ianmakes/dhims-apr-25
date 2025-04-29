
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Timeline() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Timeline</h1>
      <Card className="p-6">
        <p className="text-muted-foreground">Timeline content will be displayed here.</p>
      </Card>
    </div>
  );
}
