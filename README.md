WonderConnect: Real-Time Messaging Application

🌟 Overview

WonderConnect is a high-performance, real-time messaging application designed to connect users through one-on-one private chats. It provides a modern, responsive chat interface leveraging Supabase for its robust Postgres database and Realtime capabilities.

The application is built using React and TypeScript to ensure a scalable and type-safe development environment, with React Query managing all server-state and caching for optimal performance.

🚀 Core Features (Real-Time Messaging)

Conversation List: A responsive sidebar displays all active one-on-one conversations for the current user.

Real-Time Sync: Utilizes Supabase Realtime subscriptions to instantly update message threads and conversation lists when new messages or conversation updates occur.

Dedicated Chat Window: Allows users to view the message history, send new messages, and receive updates in real-time.

Optimized Data Fetching: React Query (TanStack Query) handles message and conversation fetching, caching, and background synchronization, ensuring a smooth user experience.

Responsive Design: Uses Tailwind CSS for a mobile-first, responsive chat layout.

🛠️ Technology Stack

Component

Technology

Purpose

Frontend

React (Functional Components)

UI development and state management.

Styling

Tailwind CSS

Utility-first CSS framework for rapid, responsive styling.

Backend/DB

Supabase (Postgres)

Provides the primary transactional database (Postgres) and authentication layer.

Real-Time

Supabase Realtime

Manages live subscriptions for instant message delivery and conversation updates.

Data Management

React Query (TanStack Query)

Manages asynchronous data fetching, caching, and state synchronization.

Type Safety

TypeScript

Ensures type safety throughout the application.

💾 Data Architecture & Persistence (Supabase)

All application data, including conversations and messages, is secured and persisted using Supabase. The application uses two primary tables to structure the chat data, with Realtime listeners attached to both:

Supabase Table

Purpose

Key Functionality

conversations

Stores metadata about each chat session, including participants (participant_ids), and the summary of the last message (last_message_text, last_message_at).

Used for fetching and displaying the main conversation sidebar list, ordered by the latest activity.

messages

Stores the complete content of every message (content), sender ID (sender_id), and timestamp (created_at), linked to a specific conversation ID (conversation_id).

Used for fetching and displaying the message thread within the chat window. New inserts trigger Realtime updates.

⚙️ Running the Application

This application is designed to run in an environment that allows for easy Supabase configuration.

Supabase Configuration (Mandatory)

You must configure the Supabase client with your specific credentials, which are currently placeholder values in the source code.

Locate Configuration: Edit the file src/hooks/useSupabase.ts.

Replace Placeholders: Update the following constants with your actual Supabase project URL and public Anon Key:

SUPABASE_URL

SUPABASE_ANON_KEY

