import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Upload, X, Check, Tag, Image, FileText, Calendar, DollarSign, TrendingUp, Camera } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'utils/brain';
import { Evaluation } from 'types';
import { useUserGuardContext } from 'app';

interface Props {
  evaluations: Evaluation[];
  onSuccess: () => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, title: 'Basic Details', icon: TrendingUp, description: 'Symbol, type, direction, quantity' },
  { id: 2, title: 'Pricing & Timing', icon: DollarSign, description: 'Prices, dates, fees' },
  { id: 3, title: 'Custom Tags', icon: Tag, description: 'Organize with tags' },
  { id: 4, title: 'Chart Screenshots', icon: Image, description: 'Upload chart images' },
  { id: 5, title: 'Review & Submit', icon: Check, description: 'Final review' }
];

export const ManualTradeEntryForm: React.FC<Props> = ({ evaluations, onSuccess, onCancel }) => {
  const { user } = useUserGuardContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    symbol: '',
    direction: '',
    quantity: '',
    entryPrice: '',
    exitPrice: '',
    pnl: '',
    openTime: '',
    closeTime: '',
    commission: '',
    swap: '',
    customTags: [] as string[],
    chartImages: [] as string[],
    evaluationId: '',
    strategy: '',
    marketConditions: '',
    emotionsBefore: '',
    emotionsAfter: '',
    lessonsLearned: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Load tag suggestions
  useEffect(() => {
    const loadTagSuggestions = async () => {
      try {
        const response = await brain.get_tag_suggestions();
        if (response.ok) {
          const suggestions = await response.json();
          setTagSuggestions(suggestions.map((s: any) => s.tag));
        }
      } catch (error) {
        console.error('Error loading tag suggestions:', error);
      }
    };
    loadTagSuggestions();
  }, []);

  const updateFormData = useCallback((updates: Partial<ManualTradeData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.symbol && formData.direction && formData.quantity);
      case 2:
        return !!(formData.openTime && formData.closeTime); // Open time and close time required
      case 3:
        return true; // Tags are optional
      case 4:
        return true; // Images are optional
      case 5:
        return !!formData.evaluationId;
      default:
        return false;
    }
  }, [formData]);

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(5, prev + 1));
    } else {
      toast.error('Please fill in all required fields before continuing.');
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  }, []);

  const addTag = useCallback(() => {
    if (formData.newTag.trim() && !formData.customTags.includes(formData.newTag.trim())) {
      updateFormData({
        customTags: [...formData.customTags, formData.newTag.trim()],
        newTag: ''
      });
    }
  }, [formData.newTag, formData.customTags, updateFormData]);

  const removeTag = useCallback((tagToRemove: string) => {
    updateFormData({
      customTags: formData.customTags.filter(tag => tag !== tagToRemove)
    });
  }, [formData.customTags, updateFormData]);

  const removeImage = useCallback((imageId: string) => {
    updateFormData({
      chartImages: formData.chartImages.filter(id => id !== imageId)
    });
  }, [formData.chartImages, updateFormData]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processImageFile(file);
    }
  }, []);

  useEffect(() => {
    const fileInput = document.getElementById('chart-upload');
    if (fileInput) {
      const handleClick = (e: Event) => {
        console.log('Native click event triggered');
        // File picker should open automatically from this trusted event
      };
      fileInput.addEventListener('click', handleClick);
      return () => fileInput.removeEventListener('click', handleClick);
    }
  }, []);

  const handleUploadAreaClick = useCallback(() => {
    console.log('Upload area clicked!');
    const fileInput = document.getElementById('chart-upload') as HTMLInputElement;
    console.log('File input element found:', fileInput);
    console.log('File input disabled:', fileInput?.disabled);
    if (fileInput) {
      console.log('Triggering file input click...');
      fileInput.click();
      console.log('File input click triggered');
    } else {
      console.log('File input element not found!');
    }
  }, []);

  const processImageFile = useCallback(async (file: File) => {
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, GIF, WebP)');
      return;
    }

    setUploadingImage(true);
    try {
      // Use brain client for image upload
      const response = await brain.upload_image({ file });
      
      if (response.ok) {
        const result = await response.json();
        updateFormData({
          chartImages: [...formData.chartImages, result.image_id]
        });
        toast.success('Image uploaded successfully');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  }, [formData.chartImages, updateFormData]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    await processImageFile(file);
    // Reset the input so the same file can be uploaded again if needed
    event.target.value = '';
  }, [processImageFile]);

  const submitTrade = useCallback(async () => {
    if (!validateStep(4)) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert direction to trade_type that API expects
      const trade_type = formData.direction === 'Buy/Long' ? 'buy' : 'sell';
      
      // Validate required fields
      if (!formData.closeTime) {
        toast.error('Close time is required');
        setIsSubmitting(false);
        return;
      }
      
      const tradeRequest = {
        symbol: formData.symbol,
        trade_type: trade_type,
        direction: formData.direction,
        quantity: parseFloat(formData.quantity),
        entry_price: formData.entryPrice ? parseFloat(formData.entryPrice) : 0,
        exit_price: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
        pnl: formData.pnl ? parseFloat(formData.pnl) : 0,
        open_time: formData.openTime,
        close_time: formData.closeTime,
        commission: parseFloat(formData.commission) || 0,
        swap: parseFloat(formData.swap) || 0,
        custom_tags: formData.customTags,
        chart_image_ids: formData.chartImages,
        evaluation_id: formData.evaluationId,
        strategy: formData.strategy,
        market_conditions: formData.marketConditions,
        emotions_before: formData.emotionsBefore,
        emotions_after: formData.emotionsAfter,
        lessons_learned: formData.lessonsLearned
      };

      const response = await brain.create_manual_trade(tradeRequest);
      if (response.ok) {
        const result = await response.json();
        toast.success('Manual trade created successfully!');
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create trade');
      }
    } catch (error) {
      console.error('Error creating manual trade:', error);
      toast.error('Failed to create trade');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateStep, onSuccess]);

  const progress = (currentStep / 5) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-blue-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Basic Trade Details</h2>
              <p className="text-gray-400">Let's start with the core information about your trade</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white">Symbol *</Label>
                <Input
                  value={formData.symbol}
                  onChange={(e) => updateFormData({ symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g., EURUSD, AAPL"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              
              <div>
                <Label className="text-white">Direction *</Label>
                <Select onValueChange={(value) => updateFormData({ direction: value })} value={formData.direction}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    <SelectItem value="buy">Buy (Long)</SelectItem>
                    <SelectItem value="sell">Sell (Short)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <Label className="text-white">Quantity/Lots *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => updateFormData({ quantity: e.target.value })}
                  placeholder="e.g., 0.1, 1.0"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Pricing & Timing</h2>
              <p className="text-gray-400">Add price and timing details for your trade</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white">Entry Price (Optional)</Label>
                <Input
                  type="number"
                  step="0.00001"
                  value={formData.entryPrice}
                  onChange={(e) => updateFormData({ entryPrice: e.target.value })}
                  placeholder="e.g., 1.1234"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white">Exit Price (Optional)</Label>
                <Input
                  type="number"
                  step="0.00001"
                  value={formData.exitPrice}
                  onChange={(e) => updateFormData({ exitPrice: e.target.value })}
                  placeholder="e.g., 1.1245"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white">P&L/Result (Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.pnl}
                  onChange={(e) => updateFormData({ pnl: e.target.value })}
                  placeholder="e.g., 150.50 or -75.25"
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Positive for profit, negative for loss</p>
              </div>

              <div>
                <Label className="text-white">Commission (Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.commission}
                  onChange={(e) => updateFormData({ commission: e.target.value })}
                  placeholder="e.g., 5.00"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white">Open Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.openTime}
                  onChange={(e) => updateFormData({ openTime: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-white">Close Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.closeTime}
                  onChange={(e) => updateFormData({ closeTime: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Tag className="w-12 h-12 mx-auto mb-4 text-orange-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Custom Tags</h2>
              <p className="text-gray-400">Organize your trades with custom tags</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={formData.newTag}
                  onChange={(e) => updateFormData({ newTag: e.target.value })}
                  placeholder="Enter a tag name"
                  className="bg-gray-900 border-gray-700 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} className="bg-blue-600 hover:bg-blue-700">
                  Add Tag
                </Button>
              </div>
              
              {tagSuggestions.length > 0 && (
                <div>
                  <Label className="text-white text-sm">Suggestions from your previous trades:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tagSuggestions.slice(0, 10).map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer border-gray-600 text-gray-300 hover:bg-blue-600/20"
                        onClick={() => {
                          if (!formData.customTags.includes(tag)) {
                            updateFormData({ customTags: [...formData.customTags, tag] });
                          }
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {formData.customTags.length > 0 && (
                <div>
                  <Label className="text-white text-sm">Selected tags:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.customTags.map(tag => (
                      <Badge key={tag} className="bg-blue-600 text-white">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:text-red-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Camera className="w-12 h-12 mx-auto mb-4 text-purple-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Chart Screenshots</h2>
              <p className="text-gray-400">Upload chart images to document your trade setups</p>
            </div>
            
            <div className="space-y-6">
              {/* Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer relative ${
                  dragActive 
                    ? 'border-purple-400 bg-purple-400/10' 
                    : 'border-gray-600 hover:border-purple-400 hover:bg-purple-400/5'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="chart-upload"
                  disabled={uploadingImage}
                />
                {uploadingImage ? (
                  <div className="flex items-center justify-center space-x-2 relative z-0">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                    <span className="text-gray-400">Uploading...</span>
                  </div>
                ) : (
                  <div className="relative z-0">
                    <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-white mb-2">Click to upload chart screenshots</p>
                    <p className="text-gray-400 text-sm">or drag and drop files here</p>
                    <p className="text-gray-500 text-xs mt-2">JPG, PNG, GIF, WebP (max 10MB)</p>
                  </div>
                )}
              </div>
              
              {/* Uploaded Images */}
              {formData.chartImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.chartImages.map((imageId, index) => (
                    <div key={imageId} className="relative group">
                      <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                        <img 
                          src={`https://static.riff.new/public/47e89438-adfe-4372-b617-66a3eabfadfe/${imageId}`}
                          alt={`Chart ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(imageId)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Check className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Review & Submit</h2>
              <p className="text-gray-400">Final details and review your trade entry</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white">Evaluation Account *</Label>
                <Select onValueChange={(value) => updateFormData({ evaluationId: value })} value={formData.evaluationId}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue placeholder="Select evaluation" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    {evaluations.map((evaluation) => (
                      <SelectItem key={evaluation.id} value={evaluation.id}>
                        {`${evaluation.firm} - ${evaluation.accountId}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-white">Strategy</Label>
                <Input
                  value={formData.strategy}
                  onChange={(e) => updateFormData({ strategy: e.target.value })}
                  placeholder="e.g., Breakout, Scalping, Swing"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              
              <div>
                <Label className="text-white">Market Conditions</Label>
                <Input
                  value={formData.marketConditions}
                  onChange={(e) => updateFormData({ marketConditions: e.target.value })}
                  placeholder="e.g., Trending up, Ranging, Volatile"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              
              <div>
                <Label className="text-white">Emotions Before Trade</Label>
                <Input
                  value={formData.emotionsBefore}
                  onChange={(e) => updateFormData({ emotionsBefore: e.target.value })}
                  placeholder="e.g., Confident, Nervous, Excited"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              
              <div>
                <Label className="text-white">Emotions After Trade</Label>
                <Input
                  value={formData.emotionsAfter}
                  onChange={(e) => updateFormData({ emotionsAfter: e.target.value })}
                  placeholder="e.g., Satisfied, Frustrated, Relieved"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              
              <div>
                <Label className="text-white">Lessons Learned</Label>
                <Input
                  value={formData.lessonsLearned}
                  onChange={(e) => updateFormData({ lessonsLearned: e.target.value })}
                  placeholder="Key takeaways from this trade"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
            
            {/* Trade Summary */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Trade Summary</CardTitle>
                <p className="text-gray-400 text-sm">Review all your trade details before submitting</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Trade Info */}
                <div>
                  <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-400">Symbol:</span> <span className="text-white font-medium">{formData.symbol}</span></div>
                    <div><span className="text-gray-400">Direction:</span> <span className="text-white">{formData.direction}</span></div>
                    <div><span className="text-gray-400">Quantity:</span> <span className="text-white">{formData.quantity}</span></div>
                    {formData.evaluationId && (
                      <div><span className="text-gray-400">Account:</span> <span className="text-white">
                        {evaluations.find(e => e.id === formData.evaluationId)?.firm} - {evaluations.find(e => e.id === formData.evaluationId)?.accountId}
                      </span></div>
                    )}
                  </div>
                </div>

                {/* Pricing & Timing */}
                <div>
                  <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Pricing & Timing</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {formData.entryPrice && (
                      <div><span className="text-gray-400">Entry Price:</span> <span className="text-white">{formData.entryPrice}</span></div>
                    )}
                    {formData.exitPrice && (
                      <div><span className="text-gray-400">Exit Price:</span> <span className="text-white">{formData.exitPrice}</span></div>
                    )}
                    {formData.pnl && (
                      <div><span className="text-gray-400">Gross P&L:</span> <span className={`font-medium ${parseFloat(formData.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(formData.pnl) >= 0 ? '+' : ''}{formData.pnl}
                      </span></div>
                    )}
                    {formData.commission && (
                      <div><span className="text-gray-400">Commission:</span> <span className="text-white">-{formData.commission}</span></div>
                    )}
                    {formData.swap && (
                      <div><span className="text-gray-400">Swap:</span> <span className="text-white">{parseFloat(formData.swap) >= 0 ? '+' : ''}{formData.swap}</span></div>
                    )}
                    {formData.pnl && (
                      <div className="col-span-2 pt-2 border-t border-gray-700">
                        <span className="text-gray-400">Net P&L:</span> 
                        <span className={`font-bold text-lg ml-2 ${
                          (() => {
                            const grossPnl = parseFloat(formData.pnl) || 0;
                            const commission = parseFloat(formData.commission) || 0;
                            const swap = parseFloat(formData.swap) || 0;
                            const netPnl = grossPnl - commission + swap;
                            return netPnl >= 0 ? 'text-green-400' : 'text-red-400';
                          })()
                        }`}>
                          {(() => {
                            const grossPnl = parseFloat(formData.pnl) || 0;
                            const commission = parseFloat(formData.commission) || 0;
                            const swap = parseFloat(formData.swap) || 0;
                            const netPnl = grossPnl - commission + swap;
                            return (netPnl >= 0 ? '+' : '') + netPnl.toFixed(2);
                          })()}
                        </span>
                      </div>
                    )}
                    {formData.openTime && (
                      <div><span className="text-gray-400">Open Time:</span> <span className="text-white">
                        {new Date(formData.openTime).toLocaleString()}
                      </span></div>
                    )}
                    {formData.closeTime && (
                      <div><span className="text-gray-400">Close Time:</span> <span className="text-white">
                        {new Date(formData.closeTime).toLocaleString()}
                      </span></div>
                    )}
                  </div>
                </div>

                {/* Analysis & Metadata */}
                {(formData.strategy || formData.marketConditions || formData.emotionsBefore || formData.emotionsAfter || formData.lessonsLearned) && (
                  <div>
                    <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Analysis & Metadata</h4>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      {formData.strategy && (
                        <div><span className="text-gray-400">Strategy:</span> <span className="text-white">{formData.strategy}</span></div>
                      )}
                      {formData.marketConditions && (
                        <div><span className="text-gray-400">Market Conditions:</span> <span className="text-white">{formData.marketConditions}</span></div>
                      )}
                      {formData.emotionsBefore && (
                        <div><span className="text-gray-400">Emotions Before:</span> <span className="text-white">{formData.emotionsBefore}</span></div>
                      )}
                      {formData.emotionsAfter && (
                        <div><span className="text-gray-400">Emotions After:</span> <span className="text-white">{formData.emotionsAfter}</span></div>
                      )}
                      {formData.lessonsLearned && (
                        <div><span className="text-gray-400">Lessons Learned:</span> <span className="text-white">{formData.lessonsLearned}</span></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags & Attachments */}
                {(formData.customTags.length > 0 || formData.chartImages.length > 0) && (
                  <div>
                    <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Tags & Attachments</h4>
                    <div className="space-y-3">
                      {formData.customTags.length > 0 && (
                        <div>
                          <span className="text-gray-400 text-sm">Tags ({formData.customTags.length}):</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.customTags.map(tag => (
                              <Badge key={tag} className="bg-blue-600 text-white text-xs">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {formData.chartImages.length > 0 && (
                        <div>
                          <span className="text-gray-400 text-sm">Chart Screenshots ({formData.chartImages.length}):</span>
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {formData.chartImages.map((imageId, index) => (
                              <div key={imageId} className="aspect-square bg-gray-700 rounded overflow-hidden">
                                <img 
                                  src={`https://static.riff.new/public/47e89438-adfe-4372-b617-66a3eabfadfe/${imageId}`}
                                  alt={`Chart ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">Manual Trade Entry</h1>
          <Button variant="outline" onClick={onCancel} className="border-gray-600 text-gray-300 hover:bg-gray-700">
            Cancel
          </Button>
        </div>
        
        <Progress value={progress} className="mb-4 h-2" />
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Step {currentStep} of 5</span>
          <span className="text-gray-400">{Math.round(progress)}% complete</span>
        </div>
        
        {/* Step indicators */}
        <div className="flex items-center justify-center mt-6 space-x-2 md:space-x-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted ? 'bg-green-600 shadow-lg shadow-green-600/25' : isActive ? 'bg-blue-600 shadow-lg shadow-blue-600/25 ring-2 ring-blue-400/50' : 'bg-gray-700'
                }`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {step.id < STEPS.length && (
                  <div className={`w-8 md:w-12 h-1 transition-all duration-300 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Step Content */}
      <Card className="bg-gray-900/90 border-gray-800 shadow-2xl">
        <CardContent className="p-6 md:p-8">
          {renderStep()}
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        {currentStep < 5 ? (
          <Button
            onClick={nextStep}
            disabled={!validateStep(currentStep)}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={submitTrade}
            disabled={!validateStep(5) || isSubmitting}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-all duration-200 shadow-lg"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b border-white" />
                Creating Trade...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Create Trade
              </div>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
