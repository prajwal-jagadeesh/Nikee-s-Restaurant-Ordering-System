'use client';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { menuItems, menuCategories } from '@/lib/data';
import type { MenuItem, OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Plus, Minus, ShoppingCart, Trash2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { suggestPopularDishes } from '@/ai/flows/suggest-popular-dishes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatePresence, motion } from 'framer-motion';

function PopularDishes({toast}: {toast: any}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');

  const getSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await suggestPopularDishes({
        userInput: userInput,
        menu: JSON.stringify(menuItems),
        pastTrends: 'Paneer Butter Masala, Aglio e Olio Spaghetti, Butterfly Paneer Crisps are frequently ordered.',
        pastOrderHistory: '',
      });
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('AI suggestion failed:', error);
      toast({
        variant: 'destructive',
        title: 'Suggestion Failed',
        description: 'Sorry, I couldn\'t come up with suggestions right now. Please try again.',
      })
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6 bg-primary/5 border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Wand2 className="text-primary" />
          Feeling Adventurous?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">Get AI-powered dish recommendations!</p>
        <div className="space-y-2">
            <Label htmlFor="dish-preference">Tell us what you're in the mood for (e.g., "spicy", "healthy", "something light")</Label>
            <Input 
                id="dish-preference"
                placeholder="e.g. something light..." 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isLoading}
            />
        </div>
        <Button onClick={getSuggestions} disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Suggest Dishes'}
        </Button>
        {suggestions.length > 0 && (
          <div className="pt-4">
            <h4 className="font-semibold mb-2">Our suggestions:</h4>
            <ul className="list-disc list-inside space-y-1 text-primary-foreground/90">
              {suggestions.map((dish, i) => <li key={i}>{dish}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CustomerView() {
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get('table') || '5';
  const { toast } = useToast();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeTab, setActiveTab] = useState(menuCategories[0]);


  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    toast({ title: `${item.name} added to cart` });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        toast({ title: `${prev.find(i => i.menuItem.id === itemId)?.menuItem.name} removed from cart`, variant: 'destructive' });
        return prev.filter((i) => i.menuItem.id !== itemId);
      }
      return prev.map((i) =>
        i.menuItem.id === itemId ? { ...i, quantity } : i
      );
    });
  };

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  const placeOrder = () => {
    if (cart.length === 0) {
      toast({ title: "Your cart is empty!", variant: 'destructive' });
      return;
    }
    toast({
      title: 'Order Placed!',
      description: `Your order from Table ${tableNumber} has been sent to the kitchen.`,
    });
    // Here you would typically send the order to a backend.
    console.log('Order Placed:', { tableNumber, cart, total });
    setCart([]);
  };

  const filteredMenuItems = useMemo(() => menuItems.filter(item => item.category === activeTab), [activeTab]);

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold font-headline">Welcome to Nikee's Zara</h1>
        <p className="text-lg text-muted-foreground">You are ordering for Table {tableNumber}</p>
      </div>

      <PopularDishes toast={toast} />

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
          {menuCategories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
          ))}
        </TabsList>
        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {filteredMenuItems.map((item) => (
                        <Card key={item.id} className="h-full flex flex-col overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 bg-card/70">
                            <CardHeader>
                                <CardTitle>{item.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center mt-auto">
                            <span className="font-bold text-lg">₹{item.price.toFixed(2)}</span>
                            <Button onClick={() => addToCart(item)}>Add to Order</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>
      </Tabs>

      <Sheet>
        <SheetTrigger asChild>
          <Button className="fixed bottom-6 right-6 rounded-full h-16 w-16 shadow-lg">
            <ShoppingCart />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Your Order (Table {tableNumber})</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center mt-8">Your cart is empty.</p>
            ) : (
              <div className="space-y-4 mt-4">
                {cart.map(item => (
                  <div key={item.menuItem.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-semibold">{item.menuItem.name}</p>
                      <p className="text-sm text-muted-foreground">₹{item.menuItem.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                        <span>{item.quantity}</span>
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">₹{(item.menuItem.price * item.quantity).toFixed(2)}</p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => updateQuantity(item.menuItem.id, 0)}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cart.length > 0 && (
            <SheetFooter className="border-t pt-4 mt-auto bg-background">
                <div className="w-full space-y-4">
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                    <Button size="lg" className="w-full" onClick={placeOrder}>Place Order</Button>
                </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
