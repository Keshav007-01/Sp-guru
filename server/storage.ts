import {
  Deity,
  User,
  Mantra,
  UserSession,
  UserFavorite,
  ChantHistory,
  DailyMantra,
  CommunityPost,
  GuidedMeditation,
  BlogPost,
  InsertUser,
  InsertDeity,
  InsertMantra,
  InsertUserFavorite,
  InsertChantHistory,
  InsertDailyMantra,
  InsertCommunityPost,
  InsertGuidedMeditation,
  InsertBlogPost,
  FeaturedMantra,
  UserProfile,
  UserMantra
} from "@shared/schema";

interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getUserProfile(id: number): Promise<UserProfile | undefined>;
  
  // User sessions
  createUserSession(userId: number): Promise<UserSession>;
  getUserSession(sessionId: string): Promise<UserSession | undefined>;
  deleteUserSession(sessionId: string): Promise<void>;
  
  // Deities
  getDeities(): Promise<Deity[]>;
  getDeity(id: string): Promise<Deity | undefined>;
  
  // Mantras
  getMantras(deityId: string): Promise<Mantra[]>;
  getMantra(id: string): Promise<Mantra | undefined>;
  getUserMantras(userId: number, deityId?: string): Promise<UserMantra[]>;
  getDeityWithMantras(deityId: string): Promise<(Deity & { mantras: Mantra[] }) | undefined>;
  getMantraWithDeity(mantraId: string): Promise<{ mantra: Mantra, deity: Deity } | undefined>;
  
  // Favorites
  addFavorite(userId: number, mantraId: string): Promise<UserFavorite>;
  removeFavorite(userId: number, mantraId: string): Promise<boolean>;
  getUserFavorites(userId: number): Promise<(UserFavorite & { mantra: Mantra, deity: Deity })[]>;
  
  // Chant history
  addChantHistory(chant: InsertChantHistory): Promise<ChantHistory>;
  getUserChantHistory(userId: number, limit?: number): Promise<(ChantHistory & { mantra: Mantra, deity: Deity })[]>;
  
  // Daily mantras
  setDailyMantra(dailyMantra: InsertDailyMantra): Promise<DailyMantra>;
  getDailyMantra(): Promise<(DailyMantra & { mantra: Mantra, deity: Deity }) | undefined>;
  
  // Featured mantra
  getFeaturedMantra(): Promise<FeaturedMantra | undefined>;
  
  // Community posts
  createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost>;
  getCommunityPosts(limit?: number, deityId?: string, mantraId?: string): Promise<(CommunityPost & { user: User })[]>;
  getCommunityPost(id: number): Promise<(CommunityPost & { user: User }) | undefined>;
  updateCommunityPost(id: number, post: Partial<CommunityPost>): Promise<CommunityPost | undefined>;
  deleteCommunityPost(id: number): Promise<boolean>;
  
  // Guided meditations
  createGuidedMeditation(meditation: InsertGuidedMeditation): Promise<GuidedMeditation>;
  getGuidedMeditations(limit?: number, deityId?: string): Promise<GuidedMeditation[]>;
  getGuidedMeditation(id: number): Promise<GuidedMeditation | undefined>;
  
  // Blog posts
  getBlogPosts(limit?: number, category?: string): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | null>;
  getBlogPostById(id: number): Promise<BlogPost | null>;
  clearBlogPosts(): Promise<void>;
  addBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | null>;
  incrementBlogPostViewCount(id: number): Promise<void>;
}

// Helper to create a mantra with proper defaults
function createMantra(mantra: Partial<Mantra> & { id: string, deityId: string, title: string }): Mantra {
  return {
    id: mantra.id,
    deityId: mantra.deityId,
    title: mantra.title,
    sanskrit: mantra.sanskrit || "",
    transliteration: mantra.transliteration || "",
    meaning: mantra.meaning || "",
    benefits: mantra.benefits || "",
    audioUrl: mantra.audioUrl || null,
    backgroundMusic: mantra.backgroundMusic || null
  };
}

// In-memory storage implementation
class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private userSessions: Map<string, UserSession> = new Map();
  private deities: Map<string, Deity> = new Map();
  private mantras: Map<string, Mantra> = new Map();
  private userFavorites: Map<string, UserFavorite> = new Map();
  private chantHistory: Map<number, ChantHistory> = new Map();
  private dailyMantras: Map<number, DailyMantra> = new Map();
  private communityPosts: Map<number, CommunityPost> = new Map();
  private guidedMeditations: Map<number, GuidedMeditation> = new Map();
  private blogPosts: Map<number, BlogPost> = new Map();
  
  private currentUserId = 1;
  private currentChantHistoryId = 1;
  private currentDailyMantraId = 1;
  private currentCommunityPostId = 1;
  private currentGuidedMeditationId = 1;
  private currentBlogPostId = 1;
  
  constructor() {
    this.initializeData();
  }
  
  private initializeData() {
    // Seed with initial data
    this.initializeDeities();
    this.initializeMantras();
  }
  
  private initializeDeities() {
    const deitiesToAdd: InsertDeity[] = [
      {
        id: "shiva",
        name: "Lord Shiva",
        description: "The destroyer and transformer",
        longDescription: "Lord Shiva is one of the principal deities of Hinduism. He is known as the Destroyer within the Trimurti, the Hindu trinity that includes Brahma and Vishnu. In Shaivism tradition, Shiva is the Supreme being who creates, protects and transforms the universe.",
        svgIcon: `<img src="/images/lord-shiva.png" alt="Lord Shiva" class="deity-icon" style="width: 100%; height: 100%; object-fit: cover;" />`,
        mantraCount: 2
      },
      {
        id: "vishnu",
        name: "Lord Vishnu",
        description: "The preserver and protector",
        longDescription: "Lord Vishnu is one of the principal deities of Hinduism. He is the Supreme Being or Ultimate Reality for Vaishnavites and a manifestation of Brahman in the Advaita or Smarta traditions of Hinduism. Vishnu is known as 'The Preserver' within the Trimurti.",
        svgIcon: `<img src="/images/lord-vishnu.png" alt="Lord Vishnu" class="deity-icon" style="width: 100%; height: 100%; object-fit: cover;" />`,
        mantraCount: 2
      },
      {
        id: "ganesha",
        name: "Lord Ganesha",
        description: "The remover of obstacles",
        longDescription: "Lord Ganesha is one of the best-known and most worshipped deities in the Hindu pantheon. He is widely revered as the remover of obstacles, the patron of arts and sciences, and the God of intellect and wisdom. Ganesha is also referred to as Ganapati and Vinayaka.",
        svgIcon: `<img src="/images/lord-ganesh.png" alt="Lord Ganesha" class="deity-icon" style="width: 100%; height: 100%; object-fit: cover;" />`,
        mantraCount: 2
      },
      {
        id: "lakshmi",
        name: "Goddess Lakshmi",
        description: "The goddess of wealth and prosperity",
        longDescription: "Goddess Lakshmi is the Hindu goddess of wealth, fortune, and prosperity. She is the wife and active energy of Lord Vishnu, an important deity in Vaishnavism. Lakshmi is depicted as a beautiful woman of golden complexion, with four hands, sitting or standing on a lotus flower.",
        svgIcon: `<img src="/images/goddess-lakshmi.png" alt="Goddess Lakshmi" class="deity-icon" style="width: 100%; height: 100%; object-fit: cover;" />`,
        mantraCount: 2
      },
      {
        id: "durga",
        name: "Goddess Durga",
        description: "The warrior goddess",
        longDescription: "Goddess Durga is a principal and popular form of Hindu goddess Parvati. She is the warrior goddess, whose mythology centers around combating evils and demonic forces that threaten peace, prosperity, and dharma. She is a fierce form of the protective mother goddess.",
        svgIcon: `<img src="/images/goddess-durga.png" alt="Goddess Durga" class="deity-icon" style="width: 100%; height: 100%; object-fit: cover;" />`,
        mantraCount: 2
      },
      {
        id: "hanuman",
        name: "Lord Hanuman",
        description: "The deity of strength and devotion",
        longDescription: "Lord Hanuman is a Hindu god and an ardent devotee of Lord Rama. He is a central character in the Hindu epic Ramayana. Hanuman is known for his unwavering devotion to Lord Rama and is renowned for his strength, perseverance, and selfless service.",
        svgIcon: `<img src="/images/lord-hanuman.png" alt="Lord Hanuman" class="deity-icon" style="width: 100%; height: 100%; object-fit: cover;" />`,
        mantraCount: 2
      },
      {
        id: "saraswati",
        name: "Goddess Saraswati",
        description: "The goddess of knowledge and arts",
        longDescription: "Goddess Saraswati is the Hindu goddess of knowledge, music, art, wisdom, and learning. She is a part of the trinity of Saraswati, Lakshmi, and Parvati. All the three forms help the trinity of Brahma, Vishnu, and Shiva to create, maintain, and regenerate the Universe, respectively.",
        svgIcon: `<img src="/images/goddess-saraswati.png" alt="Goddess Saraswati" class="deity-icon" style="width: 100%; height: 100%; object-fit: cover;" />`,
        mantraCount: 2
      },
      {
        id: "krishna",
        name: "Lord Krishna",
        description: "The divine statesman",
        longDescription: "Lord Krishna is a major deity in Hinduism. He is worshipped as the eighth avatar of the god Vishnu and also as the supreme God in his own right. He is the god of compassion, tenderness, love and is one of the most popular and widely revered among Hindu divinities.",
        svgIcon: `<img src="/images/lord-krishna.png" alt="Lord Krishna" class="deity-icon" style="width: 100%; height: 100%; object-fit: cover;" />`,
        mantraCount: 2
      },
      {
        id: "ram",
        name: "Lord Ram",
        description: "The ideal man and king",
        longDescription: "Lord Ram (Rama) is the seventh avatar of Lord Vishnu and one of the most widely worshipped deities in Hinduism. He is portrayed as the ideal man and king, who follows the path of dharma despite difficulties. His life and journey are chronicled in the epic Ramayana, which serves as a guide to Hindu virtues and dharmic living.",
        svgIcon: `<img src="/images/lord-ram.webp" alt="Lord Ram" class="deity-icon" style="width: 100%; height: 100%; object-fit: cover;" />`,
        mantraCount: 1
      }
    ];
    
    for (const deityData of deitiesToAdd) {
      this.deities.set(deityData.id, {
        ...deityData
      });
    }
  }
  
  private initializeMantras() {
    const mantrasToAdd: Partial<Mantra>[] = [
      // Shiva Mantras
      {
        id: "om-namah-shivaya",
        deityId: "shiva",
        title: "Om Namah Shivaya",
        sanskrit: "ॐ नमः शिवाय",
        transliteration: "Om Namah Shivaya",
        meaning: "I bow to Lord Shiva, the auspicious one who is the transformer and destroyer of evil",
        benefits: "Removes negativity, calms the mind, and brings inner peace",
        audioUrl: "/audio/om-namah-shivaya.m4a"
      },
      {
        id: "maha-mrityunjaya",
        deityId: "shiva",
        title: "Maha Mrityunjaya Mantra",
        sanskrit: "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् |\nउर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात् ||",
        transliteration: "Om Tryambakam Yajamahe Sugandhim Pushti-Vardhanam\nUrvarukamiva Bandhanan Mrityormukshiya Maamritat",
        meaning: "We worship the Three-eyed Lord who is fragrant and who nourishes all beings. As a cucumber is severed from its bondage to the vine, may He liberate us from death for the sake of immortality.",
        benefits: "Protection from untimely death, grants health, longevity and liberation",
        audioUrl: "/audio/maha-mrityunjaya.mp3"
      },
      
      // Vishnu Mantras
      {
        id: "om-namo-narayanaya",
        deityId: "vishnu",
        title: "Om Namo Narayanaya",
        sanskrit: "ॐ नमो नारायणाय",
        transliteration: "Om Namo Narayanaya",
        meaning: "I bow to Lord Narayana (Vishnu), the source of all creation",
        benefits: "Brings peace, prosperity, and divine protection",
        audioUrl: "/audio/om-namo-narayanaya.m4a"
      },
      {
        id: "om-namo-bhagavate-vasudevaya",
        deityId: "vishnu",
        title: "Om Namo Bhagavate Vasudevaya",
        sanskrit: "ॐ नमो भगवते वासुदेवाय",
        transliteration: "Om Namo Bhagavate Vasudevaya",
        meaning: "I bow to Lord Vasudeva (Krishna), the son of Vasudeva, who is the source of all existence",
        benefits: "Purifies the mind, brings spiritual peace, and divine protection",
        audioUrl: "/audio/om-namo-bhagavate-vasudevaya.m4a"
      },
      
      // Ganesha Mantras
      {
        id: "om-gam-ganapataye",
        deityId: "ganesha",
        title: "Om Gam Ganapataye Namaha",
        sanskrit: "ॐ गं गणपतये नमः",
        transliteration: "Om Gam Ganapataye Namaha",
        meaning: "I bow to Lord Ganesha, the remover of obstacles",
        benefits: "Removes obstacles, brings success in new ventures",
        audioUrl: "/audio/om-gam-ganapataye.m4a"
      },
      {
        id: "ganesha-atharva",
        deityId: "ganesha",
        title: "Vakratunda Mahakaya",
        sanskrit: "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ: ।निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥",
        transliteration: "Vakratunda Mahakaya Suryakoti Samaprabha, Nirvighnam Kuru Me Deva Sarva-Karyeshu Sarvada",
        meaning: "O Lord with the curved trunk and a mighty body, who shines with the brilliance of a million suns, please remove all obstacles from my endeavors, always.",
        benefits: "Removes obstacles, grants success in all undertakings, and bestows divine protection",
        audioUrl: "/audio/vakratunda.m4a"
      },
      
      // Lakshmi Mantras
      {
        id: "om-shri-mahalakshmyai",
        deityId: "lakshmi",
        title: "Om Shreem Mahalakshmiyei Namaha",
        sanskrit: "ॐ श्रीं महालक्ष्म्यै नमः",
        transliteration: "Om Shreem Mahalakshmiyei Namaha",
        meaning: "I bow to the Great Goddess Lakshmi",
        benefits: "Attracts abundance, prosperity, and material comforts",
        audioUrl: "/audio/om-shreem-mahalakshmiyei.m4a"
      },
      {
        id: "lakshmi-bija",
        deityId: "lakshmi",
        title: "Mahalakshmi Namastubhyam",
        sanskrit: "माहा लक्ष्मी नमसत्युभ्यम नमसत्युभ्यम जगवते आतहत्री नमसत्युभ्यम समरीधम कुरूमेसदा। नमो नमस्ते महामाया श्रीपीठे शुर पुजिते। शंक्र चक्र गदाहस्ते महालक्ष्मी नमोस्तुते।",
        transliteration: "Maha Lakshmi Namastubhyam Namastubhyam Jagvate Atahtri Namastubhyam Samaridham Kurumesada. Namo Namaste Mahamaya Shripeethe Shura Pujite. Shankara Chakra Gadahaste Mahalakshmi Namostute.",
        meaning: "Salutations to the Great Goddess Lakshmi who is the mother of the universe. I bow to you who brings prosperity and success. Obeisance to you, the Great Maya, seated on the auspicious throne, worshipped by the brave. With conch, discus, and mace in your hands, O Great Lakshmi, I bow to you.",
        benefits: "Bestows wealth, prosperity, and removes financial obstacles",
        audioUrl: "/audio/mahalakshmi-namastubhyam.m4a"
      },
      
      // Durga Mantras
      {
        id: "om-dum-durgayai",
        deityId: "durga",
        title: "Om Dum Durgayai Namaha",
        sanskrit: "ॐ दुं दुर्गायै नमः",
        transliteration: "Om Dum Durgayai Namaha",
        meaning: "I bow to Goddess Durga",
        benefits: "Provides protection, strength, and courage to overcome difficulties",
        audioUrl: "/audio/om-dum-durgayai.m4a"
      },
      {
        id: "durga-jayanti-mangala",
        deityId: "durga",
        title: "Durga Jayanti Mangala Stotra",
        sanskrit: "ॐ जयंती मंगला काली भद्रकाली कपालिनी दुर्गा क्षमा शिवा धात्री स्वाहा स्वधा नमोऽस्तुते",
        transliteration: "Om Jayanti Mangala Kali Bhadrakali Kapalini Durga Kshama Shiva Dhatri Svaha Svadha Namostute",
        meaning: "I bow to the Divine Mother who is victorious, auspicious, the force of time, the benefactor, the remover of darkness, the holder of the cosmic intelligence, the forgiver, the consort of Shiva, and the sustainer of the universe",
        benefits: "Removes all obstacles, grants divine protection, and fulfills wishes",
        audioUrl: "/audio/durga-jayanti-mangala.m4a"
      },
      
      // Hanuman Mantras
      {
        id: "hanuman-mantra",
        deityId: "hanuman",
        title: "Hanuman Mantra",
        sanskrit: "ॐ हनुमते नमः",
        transliteration: "Om Hanumate Namaha",
        meaning: "I bow to Lord Hanuman",
        benefits: "Grants strength, courage, and protection from negative energies",
        audioUrl: "/audio/om-hanumate-namaha.m4a"
      },
      {
        id: "hanuman-gayatri",
        deityId: "hanuman",
        title: "Hanuman Gayatri Mantra",
        sanskrit: "ॐ अंजनेयाय विद्महे वायुपुत्राय धीमहि तन्नो हनुमत प्रचोदयात्",
        transliteration: "Om Anjaneya Vidmahe Vayuputraya Dhimahi Tanno Hanumat Prachodayat",
        meaning: "We meditate on Anjaneya and attain knowledge of the son of the Wind God. May the celibate Hanuman illuminate our intellect and destroy our ignorance.",
        benefits: "Removes obstacles, grants physical strength, courage, and enhances intellect",
        audioUrl: "/audio/hanuman-gayatri-mantra.m4a"
      },
      
      // Saraswati Mantras
      {
        id: "saraswati-mantra",
        deityId: "saraswati",
        title: "Saraswati Mantra",
        sanskrit: "ॐ ऐं सरस्वत्यै नमः",
        transliteration: "Om Aim Saraswatyai Namaha",
        meaning: "I bow to Goddess Saraswati",
        benefits: "Enhances intelligence, creativity, and learning abilities",
        audioUrl: "/audio/saraswati-mantra.m4a"
      },
      {
        id: "om-aksharaya-namah",
        deityId: "saraswati",
        title: "Om Aksharaya Namah",
        sanskrit: "ॐ अक्षराय नमः",
        transliteration: "Om Aksharaya Namah",
        meaning: "I bow to the Imperishable One, the Eternal Source of Knowledge",
        benefits: "Enhances intellect, wisdom, and connection to eternal knowledge",
        audioUrl: "/audio/om-aksharaya-namah.m4a"
      },
      
      // Krishna Mantras
      {
        id: "krishna-mantra",
        deityId: "krishna",
        title: "Hare Krishna Mantra",
        sanskrit: "हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे। हरे राम हरे राम राम राम हरे हरे॥",
        transliteration: "Hare Krishna Hare Krishna Krishna Krishna Hare Hare, Hare Rama Hare Rama Rama Rama Hare Hare",
        meaning: "An invocation of the divine energies of Krishna and Rama",
        benefits: "Purifies the mind, brings spiritual joy and awakening",
        audioUrl: "/audio/hare-krishna-mantra.m4a"
      },
      {
        id: "gopal-mantra",
        deityId: "krishna",
        title: "Krishna Vasudeva Mantra",
        sanskrit: "कृष्णाय वासुदेवाय हरये परमात्मने। प्रणत: क्लेशनाशाय गोविंदाय नमो नम:",
        transliteration: "Krishnaya Vasudevaya Haraye Paramatmane, Pranatah Kleshanashaya Govindaya Namo Namah",
        meaning: "I bow to Lord Krishna, the son of Vasudeva, the remover of distress, who is the Supreme Soul",
        benefits: "Removes obstacles, brings divine protection, and grants peace of mind",
        audioUrl: "/audio/krishna-vasudeva-mantra.m4a"
      },
      
      // Ram Mantras
      {
        id: "ram-rameti",
        deityId: "ram",
        title: "Shri Ram Rameti",
        sanskrit: "राम राम रामेति रमे रामे मनोरमे । सहस्रनाम तत्तुल्यं रामनाम वरानने ॥",
        transliteration: "Rama Rama Rameti Rame Raame Manorame, Sahasranama Tattulyam Rama Nama Varaanane",
        meaning: "O beautiful-faced one, the name of Rama, Rama, Rama is equal to the thousand names of the Lord and gives immense joy to the mind.",
        benefits: "Removes negative influences, brings peace, and grants protection to the chanter",
        audioUrl: "/audio/Ram rameti.m4a"
      }
    ];
    
    // Process and add all mantras
    for (const mantraData of mantrasToAdd) {
      const mantra = createMantra(mantraData as any);
      this.mantras.set(mantra.id, mantra);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      email: insertUser.email ?? null,
      displayName: insertUser.displayName ?? null,
      avatarUrl: insertUser.avatarUrl ?? null,
      preferences: "{}",
      notificationsEnabled: insertUser.notificationsEnabled ?? true
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUserProfile(id: number): Promise<UserProfile | undefined> {
    // For a static user ID (like our dummy auth), we ensure a user exists
    let user = await this.getUser(id);
    
    if (!user) {
      // Create a default user profile if not found
      console.log(`Creating default user profile for ID: ${id}`);
      
      // This is a stub for testing - in production, we'd never create fake data
      const newUser: User = {
        id,
        username: "devotee",
        displayName: "Spiritual Devotee",
        email: "devotee@example.com",
        password: "hashed-password", // In real app, would be properly hashed
        createdAt: new Date(),
        avatarUrl: null,
        preferences: null,
        notificationsEnabled: null
      };
      
      // Save the user
      this.users.set(id, newUser);
      user = newUser;
    }
    
    // Get user stats
    const chants = Array.from(this.chantHistory.values()).filter(ch => ch.userId === id);
    const favorites = Array.from(this.userFavorites.values()).filter(fav => fav.userId === id);
    
    // Calculate streak days based on consecutive days with chants
    // In this demo, we'll use a simple count, but real logic would check consecutive days
    const streakDays = Math.min(7, chants.length); // Max 7 for demo purposes
    
    // Get last active date from most recent chant or current date
    const lastActive = chants.length > 0 
      ? chants.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())[0].completedAt
      : new Date();
    
    console.log(`Returning profile for user ${id}:`, {
      totalChants: chants.length,
      favoriteCount: favorites.length,
      streakDays,
    });
    
    return {
      ...user,
      totalChants: chants.length,
      favoriteCount: favorites.length,
      streakDays,
      lastActive
    };
  }
  
  // User sessions
  async createUserSession(userId: number): Promise<UserSession> {
    const id = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const session: UserSession = {
      id,
      userId,
      expiresAt
    };
    
    this.userSessions.set(id, session);
    return session;
  }
  
  async getUserSession(sessionId: string): Promise<UserSession | undefined> {
    return this.userSessions.get(sessionId);
  }
  
  async deleteUserSession(sessionId: string): Promise<void> {
    this.userSessions.delete(sessionId);
  }
  
  // Deity methods
  async getDeities(): Promise<Deity[]> {
    return Array.from(this.deities.values());
  }
  
  async getDeity(id: string): Promise<Deity | undefined> {
    return this.deities.get(id);
  }
  
  // Mantra methods
  async getMantras(deityId: string): Promise<Mantra[]> {
    return Array.from(this.mantras.values()).filter(mantra => mantra.deityId === deityId);
  }
  
  async getMantra(id: string): Promise<Mantra | undefined> {
    return this.mantras.get(id);
  }
  
  async getUserMantras(userId: number, deityId?: string): Promise<UserMantra[]> {
    // Get user favorites
    const favorites = await this.getUserFavorites(userId);
    const favoriteIds = favorites.map(fav => fav.mantraId);
    
    // Get user chanting history
    const history = await this.getUserChantHistory(userId);
    
    // Create a map of chant counts per mantra
    const chantCounts: Map<string, number> = new Map();
    const lastChanted: Map<string, Date> = new Map();
    
    for (const chant of history) {
      const count = chantCounts.get(chant.mantraId) || 0;
      chantCounts.set(chant.mantraId, count + 1);
      
      const current = lastChanted.get(chant.mantraId);
      if (!current || chant.completedAt > current) {
        lastChanted.set(chant.mantraId, chant.completedAt);
      }
    }
    
    // Filter mantras by deity if specified
    let mantras = Array.from(this.mantras.values());
    if (deityId) {
      mantras = mantras.filter(mantra => mantra.deityId === deityId);
    }
    
    // Create user mantras
    return mantras.map(mantra => ({
      ...mantra,
      isFavorite: favoriteIds.includes(mantra.id),
      lastChanted: lastChanted.get(mantra.id),
      totalChants: chantCounts.get(mantra.id) || 0
    }));
  }
  
  // Get full deity with mantras
  async getDeityWithMantras(deityId: string): Promise<(Deity & { mantras: Mantra[] }) | undefined> {
    const deity = await this.getDeity(deityId);
    if (!deity) return undefined;
    
    const mantras = await this.getMantras(deityId);
    return {
      ...deity,
      mantras
    };
  }
  
  // Get mantra with its deity
  async getMantraWithDeity(mantraId: string): Promise<{ mantra: Mantra, deity: Deity } | undefined> {
    const mantra = await this.getMantra(mantraId);
    if (!mantra) return undefined;
    
    const deity = await this.getDeity(mantra.deityId);
    if (!deity) return undefined;
    
    return { mantra, deity };
  }
  
  // Favorites
  async addFavorite(userId: number, mantraId: string): Promise<UserFavorite> {
    const favorite: UserFavorite = {
      userId,
      mantraId,
      createdAt: new Date()
    };
    
    const key = `${userId}:${mantraId}`;
    this.userFavorites.set(key, favorite);
    return favorite;
  }
  
  async removeFavorite(userId: number, mantraId: string): Promise<boolean> {
    const key = `${userId}:${mantraId}`;
    return this.userFavorites.delete(key);
  }
  
  async getUserFavorites(userId: number): Promise<(UserFavorite & { mantra: Mantra, deity: Deity })[]> {
    const favorites = Array.from(this.userFavorites.values())
      .filter(fav => fav.userId === userId);
      
    const result = [];
    
    for (const favorite of favorites) {
      const mantra = await this.getMantra(favorite.mantraId);
      if (!mantra) continue;
      
      const deity = await this.getDeity(mantra.deityId);
      if (!deity) continue;
      
      result.push({
        ...favorite,
        mantra,
        deity
      });
    }
    
    return result;
  }
  
  // Chant history
  async addChantHistory(chantData: InsertChantHistory): Promise<ChantHistory> {
    const id = this.currentChantHistoryId++;
    const chant: ChantHistory = {
      ...chantData,
      id,
      completedAt: new Date(),
      notes: chantData.notes ?? null
    };
    
    this.chantHistory.set(id, chant);
    return chant;
  }
  
  async getUserChantHistory(userId: number, limit?: number): Promise<(ChantHistory & { mantra: Mantra, deity: Deity })[]> {
    let history = Array.from(this.chantHistory.values())
      .filter(ch => ch.userId === userId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
      
    if (limit) {
      history = history.slice(0, limit);
    }
    
    const result = [];
    
    for (const chant of history) {
      const mantra = await this.getMantra(chant.mantraId);
      if (!mantra) continue;
      
      const deity = await this.getDeity(chant.deityId);
      if (!deity) continue;
      
      result.push({
        ...chant,
        mantra,
        deity
      });
    }
    
    return result;
  }
  
  // Daily mantras
  async setDailyMantra(dailyMantra: InsertDailyMantra): Promise<DailyMantra> {
    const id = this.currentDailyMantraId++;
    const mantra: DailyMantra = {
      ...dailyMantra,
      id,
      featureDate: new Date(),
      description: dailyMantra.description ?? null
    };
    
    this.dailyMantras.set(id, mantra);
    return mantra;
  }
  
  async getDailyMantra(): Promise<(DailyMantra & { mantra: Mantra, deity: Deity }) | undefined> {
    // Get the most recent daily mantra
    const dailyMantras = Array.from(this.dailyMantras.values())
      .sort((a, b) => b.featureDate.getTime() - a.featureDate.getTime());
      
    if (dailyMantras.length === 0) return undefined;
    
    const dailyMantra = dailyMantras[0];
    const mantra = await this.getMantra(dailyMantra.mantraId);
    if (!mantra) return undefined;
    
    const deity = await this.getDeity(mantra.deityId);
    if (!deity) return undefined;
    
    return {
      ...dailyMantra,
      mantra,
      deity
    };
  }
  
  // Featured mantra
  async getFeaturedMantra(): Promise<FeaturedMantra | undefined> {
    // Check if there's a daily mantra
    const dailyMantra = await this.getDailyMantra();
    if (dailyMantra) {
      return {
        mantra: dailyMantra.mantra,
        deityId: dailyMantra.deity.id,
        deityName: dailyMantra.deity.name,
        deityDescription: dailyMantra.deity.description,
        svgIcon: dailyMantra.deity.svgIcon
      };
    }
    
    // Default featured mantra - Shiva's Om Namah Shivaya
    const mantra = await this.getMantra("om-namah-shivaya");
    if (!mantra) return undefined;
    
    const deity = await this.getDeity(mantra.deityId);
    if (!deity) return undefined;
    
    return {
      mantra,
      deityId: deity.id,
      deityName: deity.name,
      deityDescription: deity.description,
      svgIcon: deity.svgIcon
    };
  }
  
  // Community posts
  async createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost> {
    const id = this.currentCommunityPostId++;
    const now = new Date();
    
    const communityPost: CommunityPost = {
      ...post,
      id,
      createdAt: now,
      updatedAt: now,
      deityId: post.deityId ?? null,
      mantraId: post.mantraId ?? null
    };
    
    this.communityPosts.set(id, communityPost);
    return communityPost;
  }
  
  async getCommunityPosts(limit?: number, deityId?: string, mantraId?: string): Promise<(CommunityPost & { user: User })[]> {
    let posts = Array.from(this.communityPosts.values());
    
    // Filter by deity or mantra if specified
    if (deityId) {
      posts = posts.filter(post => post.deityId === deityId);
    }
    
    if (mantraId) {
      posts = posts.filter(post => post.mantraId === mantraId);
    }
    
    // Sort by most recent
    posts = posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (limit) {
      posts = posts.slice(0, limit);
    }
    
    const result = [];
    
    for (const post of posts) {
      const user = await this.getUser(post.userId);
      if (!user) continue; // Skip posts from deleted users
      
      result.push({
        ...post,
        user
      });
    }
    
    return result;
  }
  
  async getCommunityPost(id: number): Promise<(CommunityPost & { user: User }) | undefined> {
    const post = this.communityPosts.get(id);
    if (!post) return undefined;
    
    const user = await this.getUser(post.userId);
    if (!user) return undefined;
    
    return {
      ...post,
      user
    };
  }
  
  async updateCommunityPost(id: number, postData: Partial<CommunityPost>): Promise<CommunityPost | undefined> {
    const post = this.communityPosts.get(id);
    if (!post) return undefined;
    
    const updatedPost: CommunityPost = {
      ...post,
      ...postData,
      updatedAt: new Date(),
      // Ensure these are not undefined
      deityId: postData.deityId !== undefined ? postData.deityId : post.deityId,
      mantraId: postData.mantraId !== undefined ? postData.mantraId : post.mantraId
    };
    
    this.communityPosts.set(id, updatedPost);
    return updatedPost;
  }
  
  async deleteCommunityPost(id: number): Promise<boolean> {
    return this.communityPosts.delete(id);
  }
  
  // Guided meditations
  async createGuidedMeditation(meditation: InsertGuidedMeditation): Promise<GuidedMeditation> {
    const id = this.currentGuidedMeditationId++;
    
    const guidedMeditation: GuidedMeditation = {
      ...meditation,
      id,
      deityId: meditation.deityId ?? null,
      mantraId: meditation.mantraId ?? null,
      difficulty: meditation.difficulty ?? "beginner"
    };
    
    this.guidedMeditations.set(id, guidedMeditation);
    return guidedMeditation;
  }
  
  async getGuidedMeditations(limit?: number, deityId?: string): Promise<GuidedMeditation[]> {
    let meditations = Array.from(this.guidedMeditations.values());
    
    if (deityId) {
      meditations = meditations.filter(med => med.deityId === deityId);
    }
    
    // Sort by ID (most recent ID first)
    meditations = meditations.sort((a, b) => b.id - a.id);
    
    if (limit) {
      meditations = meditations.slice(0, limit);
    }
    
    return meditations;
  }
  
  async getGuidedMeditation(id: number): Promise<GuidedMeditation | undefined> {
    return this.guidedMeditations.get(id);
  }

  // Blog posts
  async getBlogPosts(limit?: number, category?: string): Promise<BlogPost[]> {
    let posts = Array.from(this.blogPosts.values());
    
    // Filter by category if provided
    if (category) {
      posts = posts.filter(post => post.category === category);
    }
    
    // Sort by creation date (newest first)
    posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply limit if provided
    if (limit && limit > 0) {
      posts = posts.slice(0, limit);
    }
    
    return posts;
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const post = Array.from(this.blogPosts.values()).find(
      post => post.slug === slug
    );
    return post || null;
  }
  
  async getBlogPostById(id: number): Promise<BlogPost | null> {
    const post = this.blogPosts.get(id);
    return post || null;
  }
  
  async clearBlogPosts(): Promise<void> {
    this.blogPosts.clear();
    this.currentBlogPostId = 1;
    return Promise.resolve();
  }
  
  async addBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const id = this.currentBlogPostId++;
    const now = new Date();
    
    const blogPost: BlogPost = {
      id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage || null,
      author: post.author || "Divine Mantras Team",
      category: post.category || "Spiritual Teachings",
      tags: post.tags || [],
      published: post.published !== undefined ? post.published : true,
      createdAt: now,
      updatedAt: now,
      viewCount: 0
    };
    
    this.blogPosts.set(id, blogPost);
    return blogPost;
  }
  
  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | null> {
    const existingPost = await this.getBlogPostById(id);
    if (!existingPost) return null;
    
    const updatedPost: BlogPost = {
      ...existingPost,
      ...post,
      updatedAt: new Date()
    };
    
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }
  
  async incrementBlogPostViewCount(id: number): Promise<void> {
    const post = await this.getBlogPostById(id);
    if (post) {
      const viewCount = post.viewCount === null ? 1 : post.viewCount + 1;
      const updatedPost = {
        ...post,
        viewCount
      };
      this.blogPosts.set(id, updatedPost);
    }
  }
}

// Export an instance of the storage
export const storage = new MemStorage();