// A utility script to create the first blog post from PDF content
import { storage } from './storage';

async function createInitialBlogPost() {
  console.log('Seeding initial blog post content...');
  
  // Check if we already have blog posts
  const existingPosts = await storage.getBlogPosts();
  if (existingPosts.length > 0) {
    console.log(`Found ${existingPosts.length} existing blog posts. Skipping seed.`);
    return;
  }
  
  // Create the first blog post - Introduction to Vedic Mantras
  const introPost = await storage.addBlogPost({
    title: "Introduction to Vedic Mantras: Unlocking the Ancient Power of Sound",
    slug: "introduction-to-vedic-mantras",
    content: `
      <article class="prose lg:prose-xl mx-auto">
        <p>
          Vedic Mantras are sacred sound vibrations derived from the Vedas, the oldest spiritual texts in the
          world. These mantras are more than just chants; they are divine frequencies that align your body,
          mind, and soul with the cosmic energy of the universe. In today's fast-paced world, Vedic mantras
          are gaining immense popularity as tools for meditation, healing, spiritual awakening, and
          manifestation.
        </p>
        
        <h2>What Are Vedic Mantras?</h2>
        <p>
          Vedic mantras are powerful sound formulas written in Sanskrit, an ancient language known for its
          vibrational precision. Each mantra holds a specific frequency that affects the nervous system, brain
          waves, and subtle energies in the body. These mantras are recited for:
        </p>
        <ul>
          <li>Peace of mind (Shanti Mantras)</li>
          <li>Health and well-being</li>
          <li>Attracting prosperity (Lakshmi Mantras)</li>
          <li>Spiritual growth and enlightenment (Gayatri Mantra)</li>
        </ul>
        
        <h2>Benefits of Chanting Vedic Mantras</h2>
        <ol>
          <li>Calms the mind and reduces stress instantly.</li>
          <li>Improves concentration and memory.</li>
          <li>Activates chakras and balances energy.</li>
          <li>Purifies negative energy in your surroundings.</li>
          <li>Helps manifest abundance, health, and success.</li>
          <li>Connects you to divine consciousness and higher realms.</li>
        </ol>
        
        <h2>Trending Vedic Mantras You Should Know</h2>
        <ul>
          <li><strong>Gayatri Mantra</strong> - Known as the most powerful mantra for awakening inner wisdom.</li>
          <li><strong>Maha Mrityunjaya Mantra</strong> - A healing mantra for health and protection.</li>
          <li><strong>Shree Suktam</strong> - Invokes the blessings of Goddess Lakshmi for wealth and abundance.</li>
          <li><strong>Saraswati Vandana</strong> - Enhances learning, creativity, and memory.</li>
        </ul>
        
        <h2>How to Use Vedic Mantras in Daily Life</h2>
        <ul>
          <li>Start your day with 5-10 minutes of mantra chanting.</li>
          <li>Use mala beads (Japa mala) to maintain focus.</li>
          <li>Chant during meditation or yoga for deeper spiritual connection.</li>
          <li>Play mantra music in the background while working or sleeping.</li>
        </ul>
        
        <h2>Why Are Vedic Mantras Trending Today?</h2>
        <p>
          With the rise of mindfulness, spiritual wellness, and energy healing, people worldwide are turning to
          ancient tools that work. Google searches for "Vedic mantra for healing," "mantra for success," and
          "chanting meditation" have skyrocketed. Influencers, yogis, and wellness coaches are using mantras
          to create viral content and transformation stories.
        </p>
        
        <h2>Start Your Journey Today</h2>
        <p>
          Whether you're looking for inner peace, divine guidance, or just want to feel more balanced in life,
          Vedic mantras can be your sacred gateway. Their power lies not only in sound but in the intention
          and devotion behind each chant.
        </p>
        <p>
          Begin with one mantra. Chant it daily. Witness the change.
        </p>
      </article>
    `,
    excerpt: "Explore the world of Vedic mantras, powerful sound vibrations derived from ancient texts that align body, mind, and soul with cosmic energy. Learn how these sacred sounds can be used for meditation, healing, and spiritual growth.",
    featuredImage: "/images/blog/vedic-mantras.jpg",
    author: "Divine Mantras Team",
    category: "Spiritual Teachings",
    tags: ["Vedic mantras", "Sanskrit", "spiritual growth", "meditation", "chanting"],
    published: true
  });
  
  console.log('Created blog post:', introPost.title);
  
  // Create the second blog post - The Power of Mantras and Meditation
  const powerPost = await storage.addBlogPost({
    title: "The Power of Mantras and Meditation",
    slug: "power-of-mantras-and-meditation",
    content: `
      <article class="prose lg:prose-xl mx-auto">
        <h2>Introduction to Mantras</h2>
        <p>
          Mantras are sacred sounds, words, or phrases that are repeated during meditation to cultivate focus and transformation. 
          They originate from ancient Hindu and Buddhist practices, where the repetition of these sounds was believed to have 
          spiritual and psychological benefits.
        </p>
        
        <h2>How Mantras Work</h2>
        <p>
          The power of mantras lies in their ability to create a resonance within the mind and body. When chanted, mantras:
        </p>
        <ul>
          <li>Create specific vibrations that affect consciousness</li>
          <li>Shift focus away from distracting thoughts</li>
          <li>Develop a rhythmic pattern that induces calmness</li>
          <li>Connect the practitioner with specific divine energies</li>
        </ul>
        
        <h2>Benefits of Mantra Meditation</h2>
        <p>
          Regular practice of mantra meditation has been shown to provide numerous benefits:
        </p>
        <ul>
          <li>Reduced stress and anxiety</li>
          <li>Improved concentration and mental clarity</li>
          <li>Enhanced self-awareness</li>
          <li>Deeper spiritual connection</li>
          <li>Better sleep quality</li>
          <li>Regulated blood pressure</li>
        </ul>
        
        <h2>Common Sanskrit Mantras and Their Meanings</h2>
        
        <h3>Om (Aum)</h3>
        <p>
          Perhaps the most fundamental of all mantras, Om represents the primordial sound of the universe. 
          It encompasses all words, all sounds, and all mantras. Chanting Om is believed to align 
          practitioners with the cosmic vibration of the universe.
        </p>
        
        <h3>Om Namah Shivaya</h3>
        <p>
          A powerful five-syllable mantra dedicated to Lord Shiva, it translates to "I bow to Shiva" or 
          "I honor the divinity within myself." This mantra is believed to liberate one from ego and negative thoughts.
        </p>
        
        <h3>Hare Krishna Maha Mantra</h3>
        <p>
          Hare Krishna, Hare Krishna, Krishna Krishna, Hare Hare, Hare Rama, Hare Rama, Rama Rama, Hare Hare.
          This 16-word mantra is central to the Hare Krishna movement and is believed to cultivate divine love
          and devotion.
        </p>
        
        <h3>Gayatri Mantra</h3>
        <p>
          Om Bhur Bhuva Swaha, Tat Savitur Varenyam, Bhargo Devasya Dhimahi, Dhiyo Yo Naha Prachodayat.
          One of the oldest and most sacred mantras in Hinduism, it is a prayer to the sun deity Savitr for 
          enlightenment and wisdom.
        </p>
        
        <h2>How to Practice Mantra Meditation</h2>
        <ol>
          <li>Find a quiet, comfortable place to sit</li>
          <li>Close your eyes and take a few deep breaths</li>
          <li>Begin repeating your chosen mantra - either aloud, as a whisper, or mentally</li>
          <li>If your mind wanders, gently bring it back to the mantra</li>
          <li>Start with 5-10 minutes and gradually increase your practice time</li>
          <li>For traditional japa meditation, use a mala (108 beads) to count repetitions</li>
        </ol>
        
        <h2>Scientific Research on Mantras</h2>
        <p>
          Modern scientific research has begun to validate the ancient wisdom behind mantra meditation:
        </p>
        <ul>
          <li>Brain imaging studies show mantras activate the parasympathetic nervous system, reducing stress</li>
          <li>Specific sound frequencies during chanting may alter brainwave patterns, promoting relaxation</li>
          <li>Regular mantra meditation practices have been shown to reduce cortisol levels</li>
          <li>Repeated mantras create a focused attention state similar to beneficial hypnotic states</li>
        </ul>
        
        <h2>Conclusion</h2>
        <p>
          The ancient practice of mantra meditation offers a powerful tool for modern living. 
          By incorporating these sacred sounds into your daily routine, you can cultivate inner peace, 
          mental clarity, and spiritual growth. Whether you're drawn to mantras for their spiritual significance or 
          for their proven psychological benefits, consistent practice reveals their transformative power.
        </p>
      </article>
    `,
    excerpt: "Discover the ancient wisdom and modern benefits of mantra meditation. Learn how sacred sounds can transform your mind, reduce stress, and deepen your spiritual practice.",
    featuredImage: "/images/blog/mantras-meditation.jpg",
    author: "Divine Mantras Team",
    category: "Spiritual Teachings",
    tags: ["mantras", "meditation", "spirituality", "Hindu practices", "Sanskrit", "wellness"],
    published: true
  });
  
  console.log('Created blog post:', powerPost.title);
}

export { createInitialBlogPost };