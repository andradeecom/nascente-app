import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Check, Target, X } from 'lucide-react-native';
import { Button, Text, TextVariants } from '@/components/atoms';
import { PlanOption } from '@/components/molecules';
import type { ProBillingCycle } from '@/types/subscription';

/** A billing offer rendered as a selectable row. */
export type PaywallOffer = {
  cycle: ProBillingCycle;
  label: string;
  price: string;
  period: string;
  caption: string;
  badge?: string;
};

type PaywallProps = {
  overline: string;
  title: string;
  subtitle: string;
  offers: PaywallOffer[];
  selectedCycle: ProBillingCycle;
  onSelectCycle: (cycle: ProBillingCycle) => void;
  featuresTitle: string;
  features: string[];
  /** Bottom CTA label (already includes the selected price). */
  ctaLabel: string;
  finePrint: string;
  restoreLabel: string;
  termsLabel: string;
  privacyLabel: string;
  /** Accessible label for the close (X) button. */
  closeLabel: string;
  onSubscribe: () => void;
  onRestore: () => void;
  onTerms: () => void;
  onPrivacy: () => void;
  onClose: () => void;
};

/**
 * Pro paywall screen UI (presentation only — no billing). A green hero header
 * (overline + title + subtitle + close), the billing-cycle picker, the full
 * feature list, and a pinned bottom CTA with fine print + restore/legal footer.
 * Wired by `src/app/paywall/` to the (not-yet-built) RevenueCat purchase flow.
 */
export function Paywall({
  overline,
  title,
  subtitle,
  offers,
  selectedCycle,
  onSelectCycle,
  featuresTitle,
  features,
  ctaLabel,
  finePrint,
  restoreLabel,
  termsLabel,
  privacyLabel,
  closeLabel,
  onSubscribe,
  onRestore,
  onTerms,
  onPrivacy,
  onClose,
}: PaywallProps) {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.brandRow}>
              <Target size={22} color={styles.heroText.color} strokeWidth={2} />
              <Text variant={TextVariants.Overline} style={styles.heroOverline}>
                {overline}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={styles.close}
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
            >
              <X size={20} color={styles.heroText.color} />
            </Pressable>
          </View>

          <Text variant={TextVariants.Display} style={styles.heroTitle}>
            {title}
          </Text>
          <Text variant={TextVariants.Body} style={styles.heroSubtitle}>
            {subtitle}
          </Text>
        </View>

        {/* ── Billing cycle picker ──────────────────────────────────────── */}
        <View style={styles.body}>
          <View style={styles.offers}>
            {offers.map((offer) => (
              <PlanOption
                key={offer.cycle}
                label={offer.label}
                price={offer.price}
                period={offer.period}
                caption={offer.caption}
                badge={offer.badge}
                selected={offer.cycle === selectedCycle}
                onSelect={() => onSelectCycle(offer.cycle)}
              />
            ))}
          </View>

          {/* ── Feature list ────────────────────────────────────────────── */}
          <Text variant={TextVariants.Overline} color="textTertiary" style={styles.featuresTitle}>
            {featuresTitle}
          </Text>
          <View style={styles.features}>
            {features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <View style={styles.featureCheck}>
                  <Check size={14} color={styles.featureCheckIcon.color} strokeWidth={3} />
                </View>
                <Text variant={TextVariants.Callout} style={styles.featureText}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Pinned CTA footer ───────────────────────────────────────────── */}
      <View style={styles.footer}>
        <Button variant="primary" label={ctaLabel} onPress={onSubscribe} fullWidth size="lg" />
        <Text variant={TextVariants.Caption} color="textTertiary" style={styles.finePrint}>
          {finePrint}
        </Text>
        <View style={styles.legalRow}>
          <Pressable onPress={onRestore} hitSlop={8} accessibilityRole="button">
            <Text variant={TextVariants.Caption} color="accent" style={styles.legalEmphasis}>
              {restoreLabel}
            </Text>
          </Pressable>
          <Text variant={TextVariants.Caption} color="textTertiary">
            {'  ·  '}
          </Text>
          <Pressable onPress={onTerms} hitSlop={8} accessibilityRole="button">
            <Text variant={TextVariants.Caption} color="textTertiary">
              {termsLabel}
            </Text>
          </Pressable>
          <Text variant={TextVariants.Caption} color="textTertiary">
            {'  ·  '}
          </Text>
          <Pressable onPress={onPrivacy} hitSlop={8} accessibilityRole="button">
            <Text variant={TextVariants.Caption} color="textTertiary">
              {privacyLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.semantic.bgPrimary,
  },
  scroll: {
    paddingBottom: theme.spacing[6],
  },
  // ── Hero ──────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: theme.colors.semantic.accent,
    paddingTop: theme.spacing[8],
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[8],
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[5],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  // Hero sits on the accent fill in every theme, so its text/icons are a fixed
  // light tone rather than a theme token (which could be dark on a dark accent).
  heroText: {
    color: '#FFFFFF',
  },
  heroOverline: {
    color: 'rgba(255,255,255,0.8)',
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    marginBottom: theme.spacing[3],
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
  },
  // ── Body ──────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[6],
  },
  offers: {
    gap: theme.spacing[3],
  },
  featuresTitle: {
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[4],
  },
  features: {
    gap: theme.spacing[4],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing[3],
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.semantic.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing[0.5],
  },
  featureCheckIcon: {
    color: theme.colors.semantic.accent,
  },
  featureText: {
    flex: 1,
  },
  // ── Footer ────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[8],
    backgroundColor: theme.colors.semantic.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.semantic.bgTertiary,
    gap: theme.spacing[3],
    ...theme.shadows.lg,
  },
  finePrint: {
    textAlign: 'center',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalEmphasis: {
    fontWeight: theme.font.weights.semibold,
  },
}));
