import { addDays, differenceInCalendarDays, format, isBefore, setHours, setMinutes } from 'date-fns';
        import type {
          AppState,
          AttachmentMode,
          Contact,
          DraftVariant,
          EmailHistoryItem,
          MetricsSnapshot,
          QueueItem,
          ResumeProfile,
        } from '../types';

        const statusOrder = ['not-contacted', 'queued', 'scheduled', 'sent', 'delivered', 'replied', 'positive', 'no-reply'] as const;
        const priorityWeight = { 'A+': 16, A: 12, B: 8, C: 4 } as const;
        const titleWeight: Record<string, number> = {
          Analyst: 14,
          Associate: 12,
          'Vice President': 9,
          Director: 7,
          'Managing Director': 5,
        };
        const roleKeywords = ['investment banking', 'm&a', 'ib', 'advisory', 'sell-side'];

        function includesAny(source: string, candidates: string[]): number {
          const lower = source.toLowerCase();
          return candidates.reduce((score, candidate) => (lower.includes(candidate.toLowerCase()) ? score + 1 : score), 0);
        }

        export function getContactName(contact: Contact): string {
          return `${contact.firstName} ${contact.lastName}`;
        }

        export function getLinkedInSearchUrl(contact: Contact): string {
          return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
            `${contact.firstName} ${contact.lastName} ${contact.firm} ${contact.school}`,
          )}`;
        }

        export function getGoogleSearchUrl(contact: Contact): string {
          const query = `${contact.firstName} ${contact.lastName} ${contact.firm} ${contact.school} investment banking`;
          return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }

        export function computeFitScore(contact: Contact, resume: ResumeProfile): number {
          const targetRole = resume.targetRole.toLowerCase();
          const resumeBody = `${resume.rawText} ${resume.pitch} ${resume.achievements.join(' ')} ${resume.skills.join(' ')}`.toLowerCase();
          const sectorMatches = contact.coverageSectors.filter((sector) => resumeBody.includes(sector.toLowerCase())).length;
          const roleMatch = includesAny(targetRole, roleKeywords) > 0 ? 10 : 4;
          const schoolMatch = resume.education.some((entry) => entry.toLowerCase().includes(contact.school.toLowerCase())) ? 14 : 0;
          const technicalDensity = Math.min(10, resume.achievements.length * 2 + resume.skills.length);
          const dealRelevance = Math.min(12, sectorMatches * 4 + (resumeBody.includes('deal') ? 2 : 0));
          const seniority = titleWeight[contact.title] ?? 6;
          const score = 28 + priorityWeight[contact.priority] + seniority + roleMatch + schoolMatch + technicalDensity + dealRelevance;
          return Math.max(0, Math.min(100, score));
        }

        export function getAutoStatus(contact: Contact): Contact['status'] {
          if (!contact.lastOutreach) {
            return contact.status;
          }
          const daysSinceOutreach = differenceInCalendarDays(new Date(), new Date(contact.lastOutreach));
          if (['sent', 'delivered'].includes(contact.status) && daysSinceOutreach >= 7) {
            return 'no-reply';
          }
          return contact.status;
        }

        export function formatRelativeOutreach(contact: Contact): string {
          if (!contact.lastOutreach) return 'Never';
          const days = differenceInCalendarDays(new Date(), new Date(contact.lastOutreach));
          return days === 0 ? 'Today' : `${days}d ago`;
        }

        export function getOptimalSendTime(contact: Contact): string {
          const base = new Date();
          const nextBusinessDay = addDays(base, base.getDay() === 5 ? 3 : base.getDay() === 6 ? 2 : 1);
          const startHour = contact.title === 'Analyst' ? 7 : contact.title === 'Associate' ? 8 : contact.title === 'Managing Director' ? 10 : 9;
          const scheduled = setMinutes(setHours(nextBusinessDay, startHour), 15);
          return scheduled.toISOString();
        }

        export function buildTailoredBullets(contact: Contact, resume: ResumeProfile): string[] {
          const baseAchievements = resume.achievements.slice(0, 3);
          const sector = contact.coverageSectors[0] ?? 'strategic advisory';
          return [
            `Position prior transaction or internship work as preparation for ${contact.team.toLowerCase()} execution across ${contact.coverageSectors.join(', ').toLowerCase()}.`,
            `Highlight one quantified result that demonstrates speed, polish, and reliability under compressed deadlines for ${contact.firm}.`,
            baseAchievements[0]
              ? `Translate this achievement into banker language: ${baseAchievements[0]}`
              : `Add a bullet tying your work directly to ${sector.toLowerCase()} diligence, valuation, or process management.`,
          ];
        }

        function trimToWallStreetLength(body: string): string {
          const words = body.split(/\s+/);
          return words.length <= 150 ? body : `${words.slice(0, 150).join(' ')}...`;
        }

        export function generateIcebreakers(contact: Contact, resume: ResumeProfile): string[] {
          const recentDeal = contact.recentTransactions[0];
          return [
            `${contact.school} alumni perspective: ask how that network helped in early live deals on ${contact.team}.`,
            `Reference ${recentDeal.company}'s ${recentDeal.value} process and ask what differentiated that mandate in ${contact.coverageSectors[0]}.`,
            `Mention your interest in ${contact.coverageSectors[0].toLowerCase()} and ask what themes the team keeps hearing from sponsors or strategics.`,
            `Use their ${contact.city} seat and ${contact.team.toLowerCase()} desk as a reason to ask about team culture and exposure for junior bankers.`,
          ].slice(0, 4 + (resume.achievements.length > 3 ? 1 : 0));
        }

        export function generateEmailVariants(contact: Contact, resume: ResumeProfile): DraftVariant[] {
          const name = getContactName(contact);
          const deal = contact.recentTransactions[0];
          const pitch = resume.pitch || 'I am building toward an investment banking seat and would value your perspective.';
          const achievement = resume.achievements[0] ?? 'built technical and client-ready output under deadline pressure';
          const schoolTie = resume.education.some((entry) => entry.toLowerCase().includes(contact.school.toLowerCase()))
            ? `As a fellow ${contact.school} alum, `
            : '';
          const baseAsk = 'If you have 15 minutes in the next week or two, I would be grateful for the chance to learn from your experience.';
          const variants: DraftVariant[] = [
            {
              label: 'Short',
              subjectA: `${contact.school} x ${contact.firm}`,
              subjectB: `Quick ${contact.team} question`,
              hook: `${schoolTie || 'I am reaching out because '}your path into ${contact.team} stands out.`,
              body: trimToWallStreetLength(
                `Hi ${contact.firstName}, ${schoolTie}I am targeting ${resume.targetRole} roles and have been especially interested in ${contact.firm}'s ${contact.team} team. ${pitch} My background includes ${achievement}. I also noticed your work on ${deal.company}'s ${deal.value} ${deal.role.toLowerCase()} assignment, which made me want to learn more about how your team approaches ${contact.coverageSectors[0].toLowerCase()} execution. ${baseAsk} Best,`,
              ),
              recommendedSendAt: getOptimalSendTime(contact),
            },
            {
              label: 'Relationship-First',
              subjectA: `${name} / ${contact.school}`,
              subjectB: `Seeking your perspective`,
              hook: `Lead with the alumni tie and ask a low-pressure career path question.`,
              body: trimToWallStreetLength(
                `Hi ${contact.firstName}, ${schoolTie}I am currently preparing for ${resume.targetRole} recruiting and hoped to learn how you navigated the jump into ${contact.team} at ${contact.firm}. I have spent a lot of time on ${contact.coverageSectors[0].toLowerCase()} and ${contact.coverageSectors[1].toLowerCase()} ideas, and my recent work includes ${achievement}. I would really value any advice on how strong candidates distinguish themselves for teams like yours. ${baseAsk} Best,`,
              ),
              recommendedSendAt: getOptimalSendTime(contact),
            },
            {
              label: 'Deal-Referenced',
              subjectA: `${deal.company} / ${contact.firm}`,
              subjectB: `${contact.team} deal question`,
              hook: `Open on a specific transaction and convert it into a thoughtful process question.`,
              body: trimToWallStreetLength(
                `Hi ${contact.firstName}, I am recruiting for ${resume.targetRole} opportunities and was drawn to your work in ${contact.team}. I recently read about ${deal.company}'s ${deal.value} assignment, and it stood out as a strong example of the kind of ${contact.coverageSectors[0].toLowerCase()} work I want to be around. My background includes ${achievement}, and I have been building a sharper understanding of valuation and process management through that lens. ${baseAsk} Best,`,
              ),
              recommendedSendAt: getOptimalSendTime(contact),
            },
            {
              label: 'Aggressive',
              subjectA: `${contact.firm} ${contact.team}`,
              subjectB: `Prepared and interested`,
              hook: `Confident but respectful; show why you are a high-signal candidate.`,
              body: trimToWallStreetLength(
                `Hi ${contact.firstName}, I am reaching out because ${contact.firm}'s ${contact.team} platform is exactly the kind of environment I am targeting. ${pitch} My experience includes ${achievement}, and I have been studying recent mandates like ${deal.company}'s ${deal.value} process to understand where strong junior bankers add leverage. I know your time is limited, but I would appreciate the chance to ask a few focused questions and learn how to position myself well for teams like yours. Best,`,
              ),
              recommendedSendAt: getOptimalSendTime(contact),
            },
          ];
          return variants;
        }

        export function generateFollowUp(contact: Contact, history: EmailHistoryItem[]): string {
          const latest = history.find((entry) => entry.contactId === contact.id);
          const deal = contact.recentTransactions[0];
          return trimToWallStreetLength(
            `Hi ${contact.firstName}, I wanted to briefly follow up on my earlier note in case it got buried. I remain very interested in ${contact.firm}'s ${contact.team} team, especially after spending more time on mandates like ${deal.company}'s ${deal.value} assignment. If there is a convenient 10-15 minute window in the coming days, I would appreciate the chance to learn from your perspective. Best,`
              + (latest ? `

Original subject: ${latest.subject}` : ''),
          );
        }

        export function buildMetrics(state: AppState): MetricsSnapshot {
          const sentLike = state.history.filter((entry) => ['sent', 'delivered', 'reply', 'positive'].includes(entry.outcome));
          const replies = state.history.filter((entry) => ['reply', 'positive'].includes(entry.outcome));
          const positiveResponses = state.history.filter((entry) => entry.outcome === 'positive').length;
          const hookMap = new Map<string, number>();
          const sendWindowMap = new Map<string, number>();
          state.history.forEach((entry) => {
            hookMap.set(entry.hook, (hookMap.get(entry.hook) ?? 0) + 1);
            const window = format(new Date(entry.sentAt), 'EEE ha');
            sendWindowMap.set(window, (sendWindowMap.get(window) ?? 0) + 1);
          });
          const topTargets = [...state.contacts]
            .sort((a, b) => computeFitScore(b, state.resume) - computeFitScore(a, state.resume))
            .slice(0, 20);

          return {
            sent: sentLike.length,
            replyRate: sentLike.length ? (replies.length / sentLike.length) * 100 : 0,
            positiveResponses,
            bestHooks: [...hookMap.entries()].map(([hook, count]) => ({ hook, count })).sort((a, b) => b.count - a.count).slice(0, 3),
            bestSendWindows: [...sendWindowMap.entries()]
              .map(([window, count]) => ({ window, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 3),
            topTargets,
          };
        }

        export function buildStrategyAnswer(question: string, state: AppState): string {
          const lower = question.toLowerCase();
          const topTargets = buildMetrics(state).topTargets.slice(0, 5);
          const topTargetSummary = topTargets.map((contact) => `${getContactName(contact)} (${contact.firm} ${contact.team})`).join(', ');

          if (lower.includes('follow') || lower.includes('no reply')) {
            const pending = state.contacts.filter((contact) => getAutoStatus(contact) === 'no-reply').slice(0, 5);
            if (!pending.length) {
              return 'You do not have an urgent no-reply cluster yet. Keep sending in a disciplined cadence and schedule follow-ups exactly seven days after the original note.';
            }
            return `Prioritize the current no-reply bucket first: ${pending.map((contact) => getContactName(contact)).join(', ')}. Use one transaction-specific sentence, then close with a very easy coffee-chat ask.`;
          }

          if (lower.includes('which contacts') || lower.includes('top targets') || lower.includes('who should')) {
            return `Your highest-signal outreach this week should be: ${topTargetSummary}. These names score well because of team fit, sector overlap, alumni affinity, and priority tier.`;
          }

          if (lower.includes('resume') || lower.includes('bullet')) {
            return 'Keep your resume bullets banker-readable: front-load the action, quantify the result, and connect at least one bullet to valuation, diligence, process management, or client-ready materials.';
          }

          return `Stay disciplined: send high-fit notes in focused batches, use the deal-referenced variant when you have a real angle, and spend most of your time on ${topTargetSummary}.`;
        }

        export function getAttachmentPayload(
          contact: Contact,
          resume: ResumeProfile,
          mode: AttachmentMode,
        ): {
          fileName: string;
          mimeType: string;
          content: string;
        } | undefined {
          if (mode === 'none') {
            return undefined;
          }
          if (mode === 'original' && resume.originalFileBase64 && resume.fileName && resume.originalMimeType) {
            return {
              fileName: resume.fileName,
              mimeType: resume.originalMimeType,
              content: resume.originalFileBase64,
            };
          }
          if (mode === 'tailored') {
            const bullets = resume.tailoredBullets[contact.id] ?? buildTailoredBullets(contact, resume);
            const content = [
              'Tailored One-Pager',
              '',
              `Target desk: ${contact.team} | ${contact.firm}`,
              `Candidate pitch: ${resume.pitch}`,
              '',
              'Tailored highlights:',
              ...bullets.map((bullet) => `- ${bullet}`),
              '',
              'Core skills:',
              ...resume.skills.map((skill) => `- ${skill}`),
            ].join('\n');
            return {
              fileName: `${contact.firstName}-${contact.lastName}-tailored-one-pager.txt`.toLowerCase(),
              mimeType: 'text/plain',
              content: btoa(unescape(encodeURIComponent(content))),
            };
          }
          return undefined;
        }

        export function sortByWorkflow(a: Contact, b: Contact, resume: ResumeProfile): number {
          const scoreDiff = computeFitScore(b, resume) - computeFitScore(a, resume);
          if (scoreDiff !== 0) return scoreDiff;
          return statusOrder.indexOf(getAutoStatus(a)) - statusOrder.indexOf(getAutoStatus(b));
        }

        export function isDue(sendAt: string): boolean {
          return isBefore(new Date(sendAt), new Date());
        }
