// ai_engine.js - Local heuristic intelligence engine for LinkVault

const DOMAIN_DATA = {
  finance: {
    verbs: ['analyze', 'calculate', 'optimize', 'invest', 'budget'],
    benefits: [
      'Helps you break down complex compound interest calculations.',
      'Enables structured tracking of personal savings and cash flow.',
      'Provides practical insights on tax-efficient investing strategies.'
    ],
    actions: [
      'Calculate your target allocation before executing any new trades.',
      'Check the recommended SIP calculators and apply them to your budget.',
      'Compare these investment routes with your current portfolio risk tolerance.'
    ],
    tags: ['wealth', 'investing', 'compounding', 'personal-finance', 'money']
  },
  marketing: {
    verbs: ['execute', 'target', 'convert', 'promote', 'track'],
    benefits: [
      'Outlines actionable frameworks for organic lead generation.',
      'Shares direct blueprints used by six-figure marketing campaigns.',
      'Demystifies customer conversion funnel optimization.'
    ],
    actions: [
      'Map this template to your next Instagram content schedule.',
      'Draft a copy variations list using the Hook-Story-Offer formula outlined.',
      'Implement the landing page changes to measure bounce rate improvements.'
    ],
    tags: ['growth', 'copywriting', 'social-media', 'funnels', 'conversion']
  },
  ai: {
    verbs: ['automate', 'prompt', 'integrate', 'build', 'leverage'],
    benefits: [
      'Saves hours of repetitive work by leveraging specific AI workflows.',
      'Provides structured prompts for high-fidelity outputs.',
      'Bridges the gap between technical AI tools and day-to-day work.'
    ],
    actions: [
      'Test the suggested custom prompt with Claude or ChatGPT tonight.',
      'Create a shortcut command for this workflow on your desktop.',
      'Document your team prompt results and share them in your internal wiki.'
    ],
    tags: ['automation', 'prompts', 'productivity', 'workflows', 'llms']
  },
  design: {
    verbs: ['prototype', 'visualize', 'refine', 'align', 'sketch'],
    benefits: [
      'Improves user retention by applying sleek modern layout patterns.',
      'Speeds up your design system workflow with atomic design principles.',
      'Curates professional font pairings and harmonious color schemes.'
    ],
    actions: [
      'Try recreating this layout grid in your current Figma sandbox.',
      'Create a style guide component representing this amber color accent.',
      'Present this interactive transition idea to your development team.'
    ],
    tags: ['ui-ux', 'figma', 'typography', 'branding', 'wireframes']
  },
  history: {
    verbs: ['examine', 'contextualize', 'explore', 'document', 'curate'],
    benefits: [
      'Explains historical correlations that shape contemporary culture.',
      'Broadens critical thinking through diverse archival narratives.',
      'Highlights key shifts in historical artistic and architectural styles.'
    ],
    actions: [
      'Read the detailed case study text during your next long commute.',
      'Note down key timeline elements for your upcoming essay/discussion.',
      'Explore the reference links to inspect primary digital source archives.'
    ],
    tags: ['culture', 'narrative', 'timeline', 'archives', 'world-history']
  },
  general: {
    verbs: ['read', 'organize', 'implement', 'reference', 'review'],
    benefits: [
      'Consolidates fragmented online resources into a structured system.',
      'Provides a starting point for specialized research on this subject.',
      'Saves you time by summarizing core principles in a neat layout.'
    ],
    actions: [
      'Block out 15 minutes this weekend to read through this resource.',
      'Tag and cross-reference this card with other items in your vault.',
      'Share this with a colleague who is working on a similar project.'
    ],
    tags: ['learning', 'resource', 'archive', 'reference', 'must-read']
  }
};

/**
 * Helper to match category domains based on title, notes, tags
 */
function detectDomain(resource) {
  const text = `${resource.title} ${resource.notes} ${(resource.tags || []).join(' ')}`.toLowerCase();
  
  if (text.match(/(finance|invest|sip|stock|money|budget|saving|wealth|tax|crypto|wallet)/)) {
    return 'finance';
  }
  if (text.match(/(marketing|growth|funnel|copywriting|hook|lead|seo|ads|conversion|sales|instagram|social)/)) {
    return 'marketing';
  }
  if (text.match(/(ai|artificial|prompt|gpt|claude|llm|automation|bot|model|machine learning|midjourney)/)) {
    return 'ai';
  }
  if (text.match(/(design|figma|ui|ux|typography|color|font|css|canvas|branding|vector|layout)/)) {
    return 'design';
  }
  if (text.match(/(history|culture|archive|art|museum|historical|century|civilization|antique)/)) {
    return 'history';
  }
  return 'general';
}

/**
 * Generate context-aware AI organization output
 */
export function organizeResource(resource, allResources = [], allCategories = []) {
  return new Promise((resolve) => {
    // 1.5 second delay to simulate AI processing and allow beautiful loading UI
    setTimeout(() => {
      const domain = detectDomain(resource);
      const data = DOMAIN_DATA[domain];
      const general = DOMAIN_DATA.general;

      // Make summary
      const cleanTitle = resource.title.replace(/[@#]/g, '').trim();
      const creatorStr = resource.creator_handle ? ` by creator ${resource.creator_handle}` : '';
      const notesSnippet = resource.notes ? ` Personal Notes detail: "${resource.notes.substring(0, 80)}..."` : '';
      
      const summary = `This ${resource.resource_type.toUpperCase()} resource, titled "${cleanTitle}"${creatorStr}, provides curated guidelines on ${domain === 'general' ? 'general organization' : domain}. It aims to help you ${data.verbs[0]} and ${data.verbs[1]} processes efficiently.${notesSnippet}`;

      // Pick reasons
      const reasons = [
        data.benefits[0],
        data.benefits[1] || general.benefits[1],
        data.benefits[2] || general.benefits[2]
      ];

      // Suggested category name if none assigned
      let suggestedCategory = null;
      if (!resource.category_id) {
        // Find matching category object
        const catMap = {
          finance: 'Finance',
          marketing: 'Marketing',
          ai: 'AI Tools',
          design: 'Design',
          history: 'History & Culture'
        };
        const catName = catMap[domain] || 'Finance';
        const found = allCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
        if (found) {
          suggestedCategory = { id: found.id, name: found.name, color: found.color, icon: found.icon };
        }
      }

      // Suggested tags (excluding already assigned)
      const currentTags = (resource.tags || []).map(t => t.toLowerCase().trim());
      const suggestedTags = data.tags
        .filter(t => !currentTags.includes(t))
        .slice(0, 3);

      // Add general tags if list is too small
      while (suggestedTags.length < 3) {
        const nextTag = general.tags.find(t => !currentTags.includes(t) && !suggestedTags.includes(t));
        if (!nextTag) break;
        suggestedTags.push(nextTag);
      }

      // Recommended Action
      const action = data.actions[Math.floor(Math.random() * data.actions.length)];

      // Find related resources based on tags or category (excluding current)
      const related = allResources
        .filter(r => r.id !== resource.id)
        .map(r => {
          let score = 0;
          // Category match
          if (r.category_id && resource.category_id && Number(r.category_id) === Number(resource.category_id)) {
            score += 3;
          }
          // Tag overlap
          const overlap = (r.tags || []).filter(t => currentTags.includes(t.toLowerCase().trim())).length;
          score += overlap * 2;
          // Creator match
          if (r.creator_handle && resource.creator_handle && r.creator_handle.toLowerCase() === resource.creator_handle.toLowerCase()) {
            score += 2;
          }
          return { resource: r, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => ({
          id: item.resource.id,
          title: item.resource.title,
          creator_handle: item.resource.creator_handle,
          resource_type: item.resource.resource_type
        }));

      resolve({
        resource_id: resource.id,
        summary,
        reasons,
        suggestedCategory,
        suggestedTags,
        recommendedAction: action,
        relatedResources: related
      });
    }, 1500);
  });
}

/**
 * Generate Weekly Digest for resources saved this week
 */
export function generateWeeklyDigest(resources, categories) {
  // Filter resources saved in the last 7 days
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const savedThisWeek = resources.filter(r => {
    const saveDate = new Date(r.date_saved || r.created_at);
    return saveDate >= oneWeekAgo;
  });

  // Group by category
  const categoriesMap = {};
  categories.forEach(c => {
    categoriesMap[c.id] = {
      name: c.name,
      color: c.color,
      icon: c.icon,
      items: []
    };
  });
  // Add 'Other' category
  categoriesMap['other'] = {
    name: 'Uncategorized',
    color: '#7f8c8d',
    icon: '📂',
    items: []
  };

  savedThisWeek.forEach(r => {
    const catId = r.category_id || 'other';
    if (categoriesMap[catId]) {
      categoriesMap[catId].items.push(r);
    } else {
      categoriesMap['other'].items.push(r);
    }
  });

  // Clean empty categories from group result
  const groupedData = Object.keys(categoriesMap)
    .map(key => ({ id: key, ...categoriesMap[key] }))
    .filter(g => g.items.length > 0);

  // Generate 3 recommended actions for the week based on types
  const actionItems = [];
  const typeCounts = { pdf: 0, link: 0, video: 0, tool: 0, other: 0 };
  savedThisWeek.forEach(r => {
    typeCounts[r.resource_type] = (typeCounts[r.resource_type] || 0) + 1;
  });

  if (typeCounts.pdf > 0) {
    actionItems.push(`Read and take highlights from one of your ${typeCounts.pdf} saved PDF guides this Wednesday.`);
  } else {
    actionItems.push('Dedicate 15 minutes to review your saved posts on Instagram and clip a new guide.');
  }

  if (typeCounts.video > 0) {
    actionItems.push(`Set aside time this weekend to watch the ${typeCounts.video} newly saved tutorial videos.`);
  } else {
    actionItems.push('Organize your design and marketing bookmarks into dedicated folders for streamlined reading.');
  }

  if (typeCounts.tool > 0 || typeCounts.link > 0) {
    actionItems.push(`Test out the newly saved links and resources in a test project to check their real-world utility.`);
  } else {
    actionItems.push('Review notes on your saved items and add custom tags to make searching faster next week.');
  }

  // Ensure exactly 3 items
  if (actionItems.length < 3) {
    actionItems.push('Review your recently saved favorites and clean out resources you no longer need.');
  }

  return {
    totalSaved: savedThisWeek.length,
    grouped: groupedData,
    actions: actionItems.slice(0, 3)
  };
}
