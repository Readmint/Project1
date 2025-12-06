// src/app/editor-dashboard/assigned/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getJSON, ApiError } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type AssignedItem = {
  assignment_id: string;
  article_id: string;
  title: string;
  status: string;
  assignment_status: string;
  assigned_date: string;
  due_date: string | null;
  priority: string | null;
};

export default function AssignedArticlesPage() {
  const [items, setItems] = useState<AssignedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAssigned = async () => {
    setLoading(true);
    try {
      // Backend: GET /editor/assigned
      const resp = await getJSON('/editor/assigned');
      if (resp.status === 'success') {
        setItems(resp.data || []);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        console.error('API error:', err.getDetailedMessage());
        alert('Failed to load assigned articles: ' + err.getDetailedMessage());
      } else {
        console.error(err);
        alert('Network error loading assigned articles.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssigned();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Assigned Articles</h1>

      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && items.length === 0 && (
        <p className="text-gray-500">No articles assigned yet.</p>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.assignment_id} className="rounded-xl">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-lg">{item.title}</h2>
                <p className="text-sm text-gray-500">
                  Status: {item.assignment_status || item.status}
                </p>
                <p className="text-xs text-gray-400">
                  Assigned: {new Date(item.assigned_date).toLocaleString()}
                </p>
              </div>

              <Link href={`/editor-dashboard/assigned/${item.article_id}/edit`}>
                <Button>Edit</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
