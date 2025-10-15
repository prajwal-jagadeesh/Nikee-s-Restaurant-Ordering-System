import type { MenuItem, Order } from '@/lib/types';
import placeholderImages from '@/lib/placeholder-images.json';

const getImage = (id: string) => {
    const placeholder = placeholderImages.placeholderImages.find(p => p.id === id);
    if(placeholder){
        return placeholder.imageUrl
    }
    const seed = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/seed/${seed}/400/400`;
}

export const menuCategories = [
  'Starters',
  'Soups',
  'Pastas & Spaghetti',
  'Artisan Breads',
  'Curries',
  'Rice Bowls',
  'Beverages',
  'Desserts',
  'Coffee'
];

export const menuItems: MenuItem[] = [
    {
        id: '1',
        name: 'Butterfly Paneer Crisps',
        description: 'Golden-fried paneer, delicately wrapped in a ribbon of potato, offering a delightful crunch. Served with a ketchup dip. 🏅👨‍🍳',
        price: 180,
        category: 'Starters',
        imageUrl: getImage('1'),
        imageHint: 'paneer crisps'
    },
    {
        id: '2',
        name: 'Dragon Fire Baby Corn',
        description: 'Crispy baby corn pieces wok-tossed in a fiery soy-chilli garlic sauce, loaded with spring onions and sprinkled with toasted sesame seeds.',
        price: 170,
        category: 'Starters',
        imageUrl: getImage('2'),
        imageHint: 'baby corn'
    },
    {
        id: '3',
        name: 'Pepper BabyCorn Crunch',
        description: 'Baby corn coated in cracked black pepper, garlic, and fragrant curry leaves for a savory bite.',
        price: 150,
        category: 'Starters',
        imageUrl: getImage('3'),
        imageHint: 'pepper babycorn'
    },
    {
        id: '4',
        name: 'Vietnamese Garden Rolls',
        description: 'Fresh rice paper rolls with carrot, bell peppers, and lettuce. Served with a sweet-chilli peanut dip.',
        price: 180,
        category: 'Starters',
        imageUrl: getImage('4'),
        imageHint: 'garden rolls'
    },
    {
        id: '5',
        name: 'Garlic Chilli Potato Bites',
        description: 'Crispy potato fingers wok-tossed in a rich garlic–soy glaze with a fiery chilly kick.',
        price: 150,
        category: 'Starters',
        imageUrl: getImage('5'),
        imageHint: 'potato bites'
    },
    {
        id: '6',
        name: 'Honey Blaze Potatoes',
        description: 'Double-fried potatoes coated in a sweet and spicy honey–chilli glaze with sesame seeds.',
        price: 170,
        category: 'Starters',
        imageUrl: getImage('6'),
        imageHint: 'honey potatoes'
    },
    {
        id: '7',
        name: 'Street-Style Veg Tacos',
        description: 'Crisp taco shells bursting with spiced Vegetables, crisp lettuce, fresh salsa, and creamy mayo.',
        price: 180,
        category: 'Starters',
        imageUrl: getImage('7'),
        imageHint: 'veg tacos'
    },
    {
        id: '8',
        name: 'Steamed Veg Dim Sums',
        description: 'Delicate dumplings filled with babycorn, cheese, and onions. Served with a soy–chilli dip.',
        price: 180,
        category: 'Starters',
        imageUrl: getImage('8'),
        imageHint: 'dim sums'
    },
    {
        id: '9',
        name: 'Peri Peri Fries',
        description: 'Golden fries tossed with a bold peri peri spice mix and served with a side of mayo.',
        price: 110,
        category: 'Starters',
        imageUrl: getImage('9'),
        imageHint: 'peri peri fries'
    },
    {
        id: '10',
        name: 'Classic Fries',
        description: 'Crispy, salted fries served with ketchup.',
        price: 90,
        category: 'Starters',
        imageUrl: getImage('10'),
        imageHint: 'classic fries'
    },
    {
        id: '11',
        name: 'Pani Puri Shots 2.0',
        description: 'A modern twist on a classic. Mini crispy puris filled with spiced potato, served with vibrant mint–coriander and tangy tamarind waters in dramatic test tubes for a fun, hands-on twist on the street classic. A playful, Insta-worthy upgrade to India’s favorite chaat. 🏅',
        price: 80,
        category: 'Starters',
        imageUrl: getImage('11'),
        imageHint: 'pani puri'
    },
    {
        id: '12',
        name: 'Rustic Manchow',
        description: 'A hearty Indo-Chinese broth with garlic, ginger, and soy, topped with crunchy fried noodles. 🏅',
        price: 100,
        category: 'Soups',
        imageUrl: getImage('12'),
        imageHint: 'manchow soup'
    },
    {
        id: '13',
        name: 'Hot & Sour Harmony',
        description: 'A perfectly balanced, tangy broth with soy, vinegar, pepper, and finely diced vegetables.',
        price: 90,
        category: 'Soups',
        imageUrl: getImage('13'),
        imageHint: 'hot sour soup'
    },
    {
        id: '14',
        name: 'Crystal Clear Herb Soup',
        description: 'A light, fragrant ginger–garlic broth with fresh coriander and spring onions.',
        price: 80,
        category: 'Soups',
        imageUrl: getImage('14'),
        imageHint: 'herb soup'
    },
    {
        id: '15',
        name: 'Creamy Alfredo Elegance',
        description: 'Penne pasta tossed in a rich white sauce with garlic, oregano, and Cheese. 🏅',
        price: 140,
        category: 'Pastas & Spaghetti',
        imageUrl: getImage('15'),
        imageHint: 'alfredo pasta'
    },
    {
        id: '16',
        name: 'Aglio e Olio Spaghetti',
        description: 'A timeless Italian classic with fresh garlic, and chilli flakes. 👨‍🍳',
        price: 180,
        category: 'Pastas & Spaghetti',
        imageUrl: getImage('16'),
        imageHint: 'aglio e olio'
    },
    {
        id: '17',
        name: 'Classic Red Sauce Spaghetti',
        description: 'Our laid-back, saucy spaghetti slathered in a rich, tangy tomato-red sauce with hints of garlic and herbs. The ultimate comfy classic with a cool kick.',
        price: 200,
        category: 'Pastas & Spaghetti',
        imageUrl: getImage('17'),
        imageHint: 'red sauce spaghetti'
    },
    {
        id: '18',
        name: 'Classic Tandoori Roti',
        description: 'Whole wheat tandoor flatbread.',
        price: 30,
        category: 'Artisan Breads',
        imageUrl: getImage('18'),
        imageHint: 'tandoori roti'
    },
    {
        id: '19',
        name: 'Butter Roti',
        description: 'Tandoori roti brushed with rich butter.',
        price: 40,
        category: 'Artisan Breads',
        imageUrl: getImage('19'),
        imageHint: 'butter roti'
    },
    {
        id: '20',
        name: 'Kulcha Traditionale',
        description: 'Soft, fluffy tandoor-baked kulcha.',
        price: 40,
        category: 'Artisan Breads',
        imageUrl: getImage('20'),
        imageHint: 'kulcha'
    },
    {
        id: '21',
        name: 'Butter Velvet Kulcha',
        description: 'Warm kulcha with a generous coat of butter.',
        price: 50,
        category: 'Artisan Breads',
        imageUrl: getImage('21'),
        imageHint: 'butter kulcha'
    },
    {
        id: '22',
        name: 'Dal Makhani Luxe',
        description: 'A rich and creamy black lentil dal, slow-simmered with butter, cream, and aromatic spices for a luxurious finish.',
        price: 150,
        category: 'Curries',
        imageUrl: getImage('22'),
        imageHint: 'dal makhani'
    },
    {
        id: '23',
        name: 'Tandoori Tadka Dal',
        description: 'Yellow moong dal with a smoky tempering of cumin and garlic in ghee.',
        price: 130,
        category: 'Curries',
        imageUrl: getImage('23'),
        imageHint: 'tadka dal'
    },
    {
        id: '24',
        name: 'Homestyle Plain Dal',
        description: 'A simple, comforting yellow dal simmered with turmeric and fresh coriander seasoning.',
        price: 110,
        category: 'Curries',
        imageUrl: getImage('24'),
        imageHint: 'plain dal'
    },
    {
        id: '25',
        name: 'Kolhapuri Zest Curry',
        description: 'A fiery Maharashtrian curry with roasted coconut, red chillies, and bold masala.',
        price: 180,
        category: 'Curries',
        imageUrl: getImage('25'),
        imageHint: 'kolhapuri curry'
    },
    {
        id: '26',
        name: 'Kadai Veg Masala',
        description: 'Veggies tossed with bell peppers, onions, and aromatic kadai spices.',
        price: 180,
        category: 'Curries',
        imageUrl: getImage('26'),
        imageHint: 'kadai veg'
    },
    {
        id: '27',
        name: 'Paneer Butter Masala',
        description: 'Our house specialty! Paneer simmered in a velvety tomato–cashew gravy, finished with kasuri methi for a truly royal experience. 👨‍🍳🏅',
        price: 200,
        category: 'Curries',
        imageUrl: getImage('27'),
        imageHint: 'paneer butter masala'
    },
    {
        id: '28',
        name: 'Seasonal Veg Mélange',
        description: 'Garden-fresh vegetables in a perfectly spiced onion–tomato gravy. 👨‍🍳',
        price: 180,
        category: 'Curries',
        imageUrl: getImage('28'),
        imageHint: 'veg melange'
    },
    {
        id: '29',
        name: 'Royal Veg Biryani',
        description: 'Aromatic vegetable biryani with saffron and whole garam masala.',
        price: 170,
        category: 'Rice Bowls',
        imageUrl: getImage('29'),
        imageHint: 'veg biryani'
    },
    {
        id: '30',
        name: 'Golden Ghee Rice',
        description: 'Basmati rice cooked with fragrant ghee, cloves, and cardamom.',
        price: 140,
        category: 'Rice Bowls',
        imageUrl: getImage('30'),
        imageHint: 'ghee rice'
    },
    {
        id: '31',
        name: 'Jeera Essence Rice',
        description: 'Steamed rice with a light tempering of cumin and ghee.',
        price: 130,
        category: 'Rice Bowls',
        imageUrl: getImage('31'),
        imageHint: 'jeera rice'
    },
    {
        id: '32',
        name: 'Curd Rice Bliss',
        description: 'A classic South Indian comfort with a tempering of curry leaves and ginger.',
        price: 80,
        category: 'Rice Bowls',
        imageUrl: getImage('32'),
        imageHint: 'curd rice'
    },
    {
        id: '33',
        name: 'Smoked Troasian Elixir',
        description: 'A tropical fruit mocktail with Strawberry Syrup, lime and herbs, finished with a hint of smoky flavor.',
        price: 200,
        category: 'Beverages',
        imageUrl: getImage('33'),
        imageHint: 'fruit mocktail'
    },
    {
        id: '34',
        name: 'End of Summer Cooler',
        description: 'A refreshing blend of citrus, blueberry syrup and fresh mint.',
        price: 160,
        category: 'Beverages',
        imageUrl: getImage('34'),
        imageHint: 'citrus cooler'
    },
    {
        id: '35',
        name: 'Spicy Guava Kick',
        description: 'Fresh guava juice with a zesty chilli–salt rim and a touch of pepper.',
        price: 120,
        category: 'Beverages',
        imageUrl: getImage('35'),
        imageHint: 'guava juice'
    },
    {
        id: '36',
        name: 'Vietnamese Iced Coffee',
        description: 'Slow-drip iced coffee with sweetened condensed milk.',
        price: 100,
        category: 'Beverages',
        imageUrl: getImage('36'),
        imageHint: 'iced coffee'
    },
    {
        id: '37',
        name: 'Classic Cold Coffee',
        description: 'A smooth, frothy frappe with a dusting of cocoa.',
        price: 150,
        category: 'Beverages',
        imageUrl: getImage('37'),
        imageHint: 'cold coffee'
    },
    {
        id: '38',
        name: 'Hazelnut Boba Bliss',
        description: 'Hazelnut coffee with chewy tapioca pearls. 🏅',
        price: 160,
        category: 'Beverages',
        imageUrl: getImage('38'),
        imageHint: 'boba coffee'
    },
    {
        id: '39',
        name: 'Raw Mango Mojito',
        description: 'Tangy raw mango with fresh mint, soda, and lime.',
        price: 180,
        category: 'Beverages',
        imageUrl: getImage('39'),
        imageHint: 'mango mojito'
    },
    {
        id: '40',
        name: 'Water (1 L)',
        description: 'Stay hydrated with pure, fresh Bisleri Himalayan spring water.',
        price: 20,
        category: 'Beverages',
        imageUrl: getImage('40'),
        imageHint: 'water bottle'
    },
    {
        id: '41',
        name: 'Mimi Doce',
        description: 'Our signature fusion dessert inspired by Mysore Pak—rich, melt-in-the-mouth traditional South Indian fudge',
        price: 130,
        category: 'Desserts',
        imageUrl: getImage('41'),
        imageHint: 'fusion dessert'
    },
    {
        id: '42',
        name: 'Affogato',
        description: 'Bold espresso poured over creamy vanilla ice cream—an unbeatable sweet caffeine fix. 🏅',
        price: 150,
        category: 'Desserts',
        imageUrl: getImage('42'),
        imageHint: 'affogato'
    },
    {
        id: '43',
        name: 'Regular Coffee',
        description: 'Light, fresh filter coffee—simple and satisfying.',
        price: 25,
        category: 'Coffee',
        imageUrl: getImage('43'),
        imageHint: 'filter coffee'
    },
    {
        id: '44',
        name: 'Large Coffee',
        description: 'A fuller cup for those who want extra comfort.',
        price: 40,
        category: 'Coffee',
        imageUrl: getImage('44'),
        imageHint: 'large coffee'
    }
];

export const initialOrders: Order[] = [
  {
    id: 'ORD001',
    tableNumber: 5,
    items: [
      { menuItem: menuItems.find(i => i.id === '1')!, quantity: 2 },
      { menuItem: menuItems.find(i => i.id === '22')!, quantity: 1 },
    ],
    status: 'New',
    timestamp: Date.now() - 5 * 60 * 1000,
    total: menuItems.find(i => i.id === '1')!.price * 2 + menuItems.find(i => i.id === '22')!.price * 1,
  },
  {
    id: 'ORD002',
    tableNumber: 3,
    items: [{ menuItem: menuItems.find(i => i.id === '29')!, quantity: 2 }],
    status: 'Preparing',
    timestamp: Date.now() - 3 * 60 * 1000,
    total: menuItems.find(i => i.id === '29')!.price * 2,
  },
  {
    id: 'ORD003',
    tableNumber: 8,
    items: [{ menuItem: menuItems.find(i => i.id === '41')!, quantity: 4 }],
    status: 'Ready',
    timestamp: Date.now() - 1 * 60 * 1000,
    total: menuItems.find(i => i.id === '41')!.price * 4,
  },
  {
    id: 'ORD004',
    tableNumber: 2,
    items: [
      { menuItem: menuItems.find(i => i.id === '12')!, quantity: 1 },
      { menuItem: menuItems.find(i => i.id === '37')!, quantity: 1 },
    ],
    status: 'Served',
    timestamp: Date.now() - 10 * 60 * 1000,
    total: menuItems.find(i => i.id === '12')!.price + menuItems.find(i => i.id === '37')!.price,
  },
];
