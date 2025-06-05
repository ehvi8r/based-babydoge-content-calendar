
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SpreadsheetPost {
  content: string;
  date: string;
  time: string;
  hashtags: string;
  status: string;
}

interface SpreadsheetUploadProps {
  onPostsImported: (posts: SpreadsheetPost[]) => void;
}

const SpreadsheetUpload = ({ onPostsImported }: SpreadsheetUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const downloadTemplate = () => {
    // Create CSV content for the template
    const csvContent = `Content,Date,Time,Hashtags,Status
"Exciting news! BabyDoge is making waves in the DeFi space with our latest partnerships and community growth!","2024-01-16","09:00","#BabyDoge #Crypto #DeFi #Base","scheduled"
"Community update: Thank you to all our holders for making BabyDoge one of the fastest growing tokens on Base!","2024-01-16","13:00","#BabyDoge #Community #Base #Crypto","scheduled"
"Weekly market analysis: BabyDoge continues to show strong fundamentals and growing adoption across the ecosystem.","2024-01-16","19:00","#BabyDoge #MarketUpdate #Analysis #Crypto","scheduled"
"Join us for our upcoming Twitter Space tonight at 8 PM EST! We'll be discussing the future of BabyDoge and answering community questions.","2024-01-17","15:00","#BabyDoge #TwitterSpace #Community #AMA","scheduled"
"🚀 New listing announcement coming soon! Stay tuned for major updates from the BabyDoge team.","2024-01-17","11:00","#BabyDoge #Listing #Announcement #Crypto","scheduled"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'babydoge-content-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Template Downloaded",
      description: "BabyDoge content template has been downloaded. Edit it and upload back!",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const processSpreadsheet = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const posts: SpreadsheetPost[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parsing (handles quoted fields)
        const values: string[] = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());
        
        if (values.length >= 5) {
          posts.push({
            content: values[0].replace(/"/g, ''),
            date: values[1].replace(/"/g, ''),
            time: values[2].replace(/"/g, ''),
            hashtags: values[3].replace(/"/g, ''),
            status: values[4].replace(/"/g, '') || 'scheduled'
          });
        }
      }
      
      onPostsImported(posts);
      
      toast({
        title: "Posts Imported Successfully",
        description: `${posts.length} posts have been imported from your spreadsheet`,
      });
      
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('spreadsheet-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "There was an error processing your spreadsheet. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileSpreadsheet className="text-green-400" size={20} />
          Bulk Import from Spreadsheet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={downloadTemplate}
            variant="outline"
            className="border-blue-500 text-blue-300 hover:bg-blue-900/50"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
          
          <div className="space-y-2">
            <Label htmlFor="spreadsheet-upload" className="text-blue-200">
              Upload CSV File
            </Label>
            <Input
              id="spreadsheet-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </div>
        
        {file && (
          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <span className="text-white text-sm">{file.name}</span>
            <Button 
              onClick={processSpreadsheet}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isProcessing ? 'Processing...' : 'Import Posts'}
            </Button>
          </div>
        )}
        
        <div className="text-xs text-slate-400">
          <p>Expected columns: Content, Date (YYYY-MM-DD), Time (HH:MM), Hashtags, Status</p>
          <p>Supports CSV files. Download the template to see the correct format.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetUpload;
