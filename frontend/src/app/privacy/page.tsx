import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy | Black Bolt Provisions LLC",
    description:
        "Privacy Policy for Black Bolt Provisions LLC — learn how we collect, use, and protect your information.",
};

export default function PrivacyPolicyPage() {
    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#000000",
                color: "#CCCCCC",
                fontFamily: "var(--font-sans, Inter, sans-serif)",
            }}
        >
            {/* Header */}
            <header
                style={{
                    maxWidth: "760px",
                    margin: "0 auto",
                    padding: "2.5rem 1.5rem 0",
                }}
            >
                <Link
                    href="/"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "#888",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        marginBottom: "2rem",
                        transition: "color 0.15s",
                    }}
                >
                    ← Back to Home
                </Link>

                <h1
                    style={{
                        fontSize: "2.25rem",
                        fontWeight: 800,
                        color: "#FFFFFF",
                        letterSpacing: "-0.03em",
                        marginBottom: "0.5rem",
                        lineHeight: 1.2,
                    }}
                >
                    Privacy Policy
                </h1>
                <p
                    style={{
                        color: "#666",
                        fontSize: "0.875rem",
                        marginBottom: "2.5rem",
                    }}
                >
                    Last updated: April 2025
                </p>
                <div
                    style={{
                        height: "1px",
                        background: "linear-gradient(90deg, #222, transparent)",
                    }}
                />
            </header>

            {/* Content */}
            <main
                style={{
                    maxWidth: "760px",
                    margin: "0 auto",
                    padding: "2rem 1.5rem 4rem",
                    lineHeight: 1.8,
                    fontSize: "0.9375rem",
                }}
            >
                {/* 1. Introduction */}
                <section style={{ marginBottom: "2rem" }}>
                    <h2
                        style={{
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            marginBottom: "0.75rem",
                        }}
                    >
                        1. Introduction
                    </h2>
                    <p>
                        Black Bolt Provisions LLC (&ldquo;we,&rdquo;
                        &ldquo;us,&rdquo; or &ldquo;our&rdquo;) provides a
                        Discord-integrated engagement and rewards infrastructure
                        designed to track and reward community participation.
                        This Privacy Policy explains how we collect, use, and
                        protect information when users interact with our Discord
                        bot, platform, and related services.
                    </p>
                </section>

                {/* 2. Information We Collect */}
                <section style={{ marginBottom: "2rem" }}>
                    <h2
                        style={{
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            marginBottom: "0.75rem",
                        }}
                    >
                        2. Information We Collect
                    </h2>
                    <p style={{ marginBottom: "0.75rem" }}>
                        To operate our services, we may collect the following
                        categories of data:
                    </p>
                    <ul
                        style={{
                            paddingLeft: "1.25rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                        }}
                    >
                        <li>
                            <strong style={{ color: "#FFF" }}>
                                Discord Identity Data:
                            </strong>{" "}
                            Discord User ID, username, discriminator, and global
                            display name to identify and associate activity with
                            your account.
                        </li>
                        <li>
                            <strong style={{ color: "#FFF" }}>
                                Engagement &amp; Activity Data:
                            </strong>{" "}
                            We collect interaction metadata such as message
                            frequency, timestamps, and participation signals to
                            calculate reward points.
                        </li>
                        <li>
                            <strong style={{ color: "#FFF" }}>
                                Message Content (Limited Use):
                            </strong>{" "}
                            If enabled through Discord&apos;s Message Content
                            Intent, message content may be temporarily processed
                            only to analyze engagement context. We do not store
                            message content long-term unless explicitly required
                            for moderation, fraud prevention, or compliance
                            purposes.
                        </li>
                        <li>
                            <strong style={{ color: "#FFF" }}>
                                Presence Data:
                            </strong>{" "}
                            Online status and activity signals (if enabled) to
                            enhance engagement tracking.
                        </li>
                        <li>
                            <strong style={{ color: "#FFF" }}>
                                Transaction Data:
                            </strong>{" "}
                            If you redeem rewards, we may collect necessary
                            contact or shipping information to fulfill orders.
                        </li>
                    </ul>
                </section>

                {/* 3. How We Use Your Data */}
                <section style={{ marginBottom: "2rem" }}>
                    <h2
                        style={{
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            marginBottom: "0.75rem",
                        }}
                    >
                        3. How We Use Your Data
                    </h2>
                    <p style={{ marginBottom: "0.75rem" }}>
                        We use collected data strictly for the following
                        purposes:
                    </p>
                    <ul
                        style={{
                            paddingLeft: "1.25rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                        }}
                    >
                        <li>
                            <strong style={{ color: "#FFF" }}>
                                Reward Processing:
                            </strong>{" "}
                            To calculate, assign, and manage engagement-based
                            rewards (&ldquo;Black Bolt&rdquo; points).
                        </li>
                        <li>
                            <strong style={{ color: "#FFF" }}>
                                Platform Functionality:
                            </strong>{" "}
                            To operate, maintain, and improve our engagement
                            infrastructure.
                        </li>
                        <li>
                            <strong style={{ color: "#FFF" }}>
                                Fraud Prevention &amp; Security:
                            </strong>{" "}
                            To detect abuse, bot activity, or manipulation of
                            engagement systems.
                        </li>
                        <li>
                            <strong style={{ color: "#FFF" }}>
                                Fulfillment:
                            </strong>{" "}
                            To process and deliver redeemed goods or services.
                        </li>
                    </ul>
                </section>

                {/* 4. Data Sharing */}
                <section style={{ marginBottom: "2rem" }}>
                    <h2
                        style={{
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            marginBottom: "0.75rem",
                        }}
                    >
                        4. Data Sharing and Third-Party Services
                    </h2>
                    <p style={{ marginBottom: "0.75rem" }}>
                        We do not sell your personal data. We may share limited
                        data only with trusted service providers necessary to
                        operate our platform, including:
                    </p>
                    <ul
                        style={{
                            paddingLeft: "1.25rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                            marginBottom: "0.75rem",
                        }}
                    >
                        <li>
                            <strong style={{ color: "#FFF" }}>
                                Infrastructure Providers:
                            </strong>{" "}
                            such as Vercel, Supabase (hosting, database, and
                            backend services)
                        </li>
                        <li>
                            <strong style={{ color: "#FFF" }}>
                                Payment Processors:
                            </strong>{" "}
                            such as Stripe (for secure transaction handling)
                        </li>
                    </ul>
                    <p>
                        These providers process data on our behalf and are
                        subject to their own privacy and security obligations.
                    </p>
                </section>

                {/* 5. Data Retention */}
                <section style={{ marginBottom: "2rem" }}>
                    <h2
                        style={{
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            marginBottom: "0.75rem",
                        }}
                    >
                        5. Data Retention
                    </h2>
                    <p style={{ marginBottom: "0.75rem" }}>
                        We retain user data only as long as necessary to operate
                        our services:
                    </p>
                    <ul
                        style={{
                            paddingLeft: "1.25rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                        }}
                    >
                        <li>
                            Engagement and activity data is retained while you
                            are actively using servers where our bot is
                            installed.
                        </li>
                        <li>
                            Data may be deleted upon request or after a period of
                            inactivity.
                        </li>
                        <li>
                            Message content, if processed, is not stored
                            long-term unless required for security or legal
                            reasons.
                        </li>
                    </ul>
                </section>

                {/* 6. User Rights */}
                <section style={{ marginBottom: "2rem" }}>
                    <h2
                        style={{
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            marginBottom: "0.75rem",
                        }}
                    >
                        6. User Rights and Control
                    </h2>
                    <p style={{ marginBottom: "0.75rem" }}>
                        You have control over your data:
                    </p>
                    <ul
                        style={{
                            paddingLeft: "1.25rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                            marginBottom: "0.75rem",
                        }}
                    >
                        <li>
                            <strong style={{ color: "#FFF" }}>
                                Access &amp; Deletion:
                            </strong>{" "}
                            You may request access to or deletion of your data
                            at any time.
                        </li>
                        <li>
                            <strong style={{ color: "#FFF" }}>Opt-Out:</strong>{" "}
                            You can stop data collection by removing the Black
                            Bolt bot from your server or revoking its
                            permissions.
                        </li>
                        <li>
                            <strong style={{ color: "#FFF" }}>
                                Post-Removal Data:
                            </strong>{" "}
                            Upon removal, associated data will be deleted within
                            a reasonable timeframe unless required for security
                            or legal obligations.
                        </li>
                    </ul>
                    <p>
                        To make a request, contact us using the details below.
                    </p>
                </section>

                {/* 7. Children's Privacy */}
                <section style={{ marginBottom: "2rem" }}>
                    <h2
                        style={{
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            marginBottom: "0.75rem",
                        }}
                    >
                        7. Children&apos;s Privacy
                    </h2>
                    <p>
                        Our services are not intended for individuals under the
                        age of 13 (or the minimum age required by Discord in
                        your region). We do not knowingly collect personal data
                        from children.
                    </p>
                </section>

                {/* 8. Security */}
                <section style={{ marginBottom: "2rem" }}>
                    <h2
                        style={{
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            marginBottom: "0.75rem",
                        }}
                    >
                        8. Security
                    </h2>
                    <p>
                        We implement reasonable technical and organizational
                        safeguards to protect your data. However, no system is
                        completely secure, and we cannot guarantee absolute
                        security.
                    </p>
                </section>

                {/* 9. Changes */}
                <section style={{ marginBottom: "2rem" }}>
                    <h2
                        style={{
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            marginBottom: "0.75rem",
                        }}
                    >
                        9. Changes to This Policy
                    </h2>
                    <p>
                        We may update this Privacy Policy from time to time.
                        Continued use of our services after changes constitutes
                        acceptance of the updated policy. We encourage users to
                        review this policy periodically.
                    </p>
                </section>

                {/* 10. Governing Law */}
                <section style={{ marginBottom: "2rem" }}>
                    <h2
                        style={{
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            marginBottom: "0.75rem",
                        }}
                    >
                        10. Governing Law
                    </h2>
                    <p>
                        This Privacy Policy is governed by the laws of the State
                        of Wyoming, United States.
                    </p>
                </section>

                {/* 11. Contact */}
                <section style={{ marginBottom: "2rem" }}>
                    <h2
                        style={{
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            color: "#FFFFFF",
                            marginBottom: "0.75rem",
                        }}
                    >
                        11. Contact Information
                    </h2>
                    <p style={{ marginBottom: "0.75rem" }}>
                        For questions, requests, or concerns regarding this
                        Privacy Policy, please contact:
                    </p>
                    <div
                        style={{
                            background: "#111",
                            border: "1px solid #222",
                            borderRadius: "12px",
                            padding: "20px",
                        }}
                    >
                        <p
                            style={{
                                margin: "0 0 4px",
                                fontWeight: 700,
                                color: "#FFFFFF",
                            }}
                        >
                            Black Bolt Provisions LLC
                        </p>
                        <a
                            href="mailto:srichard@blackboltprovisions.com"
                            style={{
                                color: "#A78BFA",
                                textDecoration: "none",
                                fontSize: "0.9rem",
                            }}
                        >
                            srichard@blackboltprovisions.com
                        </a>
                    </div>
                </section>
            </main>
        </div>
    );
}
