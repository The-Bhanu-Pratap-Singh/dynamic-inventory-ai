import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Download, Loader2, FileSpreadsheet } from "lucide-react";
import Papa from "papaparse";

const BulkImport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (!['csv', 'xlsx', 'xls'].includes(fileExt || '')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    // Parse CSV for preview
    if (fileExt === 'csv') {
      Papa.parse(selectedFile, {
        header: true,
        preview: 5,
        complete: (results) => {
          setPreview(results.data);
        },
        error: (error) => {
          toast({
            title: "Parse Error",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    } else {
      toast({
        title: "Excel Files",
        description: "Excel parsing will be implemented. For now, please convert to CSV.",
      });
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: "Sample Product",
        sku: "SKU001",
        category: "Electronics",
        sector: "retail",
        description: "Sample description",
        hsn_code: "8471",
        cost_price: "100",
        selling_price: "150",
        current_stock: "50",
        reorder_level: "10",
        tax_rate: "18"
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Use this template to format your product data",
    });
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const products = results.data.map((row: any) => ({
            name: row.name,
            sku: row.sku || null,
            category: row.category || null,
            sector: row.sector || null,
            description: row.description || null,
            hsn_code: row.hsn_code || null,
            cost_price: row.cost_price ? parseFloat(row.cost_price) : null,
            selling_price: row.selling_price ? parseFloat(row.selling_price) : null,
            current_stock: row.current_stock ? parseInt(row.current_stock) : 0,
            reorder_level: row.reorder_level ? parseInt(row.reorder_level) : 10,
            tax_rate: row.tax_rate ? parseFloat(row.tax_rate) : 18,
            created_by: user?.id || null,
          }));

          const { error } = await supabase.from("products").insert(products);

          if (error) throw error;

          toast({
            title: "Success",
            description: `${products.length} products imported successfully`,
          });

          navigate("/products");
        },
        error: (error) => {
          throw error;
        }
      });
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
                <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Bulk Import Products</h1>
                <p className="text-xs text-muted-foreground">Import multiple products from CSV/Excel</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Import Instructions</CardTitle>
              <CardDescription>Follow these steps to import products</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Download the template CSV file below</li>
                <li>Fill in your product data following the template format</li>
                <li>Upload your completed CSV file</li>
                <li>Review the preview and click Import</li>
              </ol>
              <Button onClick={downloadTemplate} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>Select a CSV or Excel file to import</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {file ? file.name : "Click to upload CSV or Excel file"}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                />
              </label>
            </CardContent>
          </Card>

          {/* Preview */}
          {preview.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview (First 5 Rows)</CardTitle>
                <CardDescription>Review your data before importing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(preview[0]).map((key) => (
                          <th key={key} className="text-left p-2 font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b">
                          {Object.values(row).map((value: any, j) => (
                            <td key={j} className="p-2">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/products")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={loading || !file}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Products"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BulkImport;
