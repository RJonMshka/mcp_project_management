--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 15.13 (Debian 15.13-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: mcp_user
--

INSERT INTO public.projects VALUES ('0b3dfaf1-239', 'learn_rust_with_ai', 'A comprehensive project to learn all of Rust''s features by building practical applications. Each task is designed to be completed within 30 minutes and focuses on specific Rust concepts, from basics to advanced features like ownership, lifetimes, async programming, and more.', 'planning', NULL, NULL, 0, 'me', '{rust,learning,programming,tutorial}', '2025-07-10 03:08:11.202036', '2025-07-10 03:08:11.202036');


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: mcp_user
--

INSERT INTO public.tasks VALUES ('c8bd2ca6-be3', '0b3dfaf1-239', 'Setup & Hello World', 'Install Rust using rustup, create your first Cargo project, understand project structure, and write a simple "Hello, World!" program. Learn about Cargo.toml and basic project organization.', 'not_started', 'critical', NULL, NULL, 0, '{}', '2025-07-10 03:08:17.68252', '2025-07-10 03:08:17.68252');
INSERT INTO public.tasks VALUES ('dc67fd31-025', '0b3dfaf1-239', 'Variables & Data Types', 'Learn about variable mutability (let vs let mut), explore Rust''s primitive data types: integers (i32, u32, etc.), floating-point numbers, booleans, and characters. Practice variable shadowing.', 'not_started', 'high', NULL, NULL, 0, '{}', '2025-07-10 03:08:23.345245', '2025-07-10 03:08:23.345245');
INSERT INTO public.tasks VALUES ('b686e86c-bdb', '0b3dfaf1-239', 'Functions & Control Flow', 'Learn function syntax, parameters, return values, and expressions vs statements. Practice if/else conditionals, loop, while, and for loops. Understand control flow patterns.', 'not_started', 'high', NULL, NULL, 0, '{}', '2025-07-10 03:08:38.203641', '2025-07-10 03:08:38.203641');
INSERT INTO public.tasks VALUES ('9fc0e617-b24', '0b3dfaf1-239', 'Ownership Basics', 'Understand Rust''s ownership system through simple examples. Learn about move semantics, what happens when values are assigned or passed to functions, and the basic rules of ownership.', 'not_started', 'critical', NULL, NULL, 0, '{}', '2025-07-10 03:08:45.115011', '2025-07-10 03:08:45.115011');
INSERT INTO public.tasks VALUES ('aa013130-5d1', '0b3dfaf1-239', 'References & Borrowing', 'Learn about references (&) and mutable references (&mut). Understand borrowing rules, when you can have multiple immutable references, and the restrictions around mutable references.', 'not_started', 'critical', NULL, NULL, 0, '{}', '2025-07-10 03:08:51.813753', '2025-07-10 03:08:51.813753');
INSERT INTO public.tasks VALUES ('d7dc623e-846', '0b3dfaf1-239', 'Structs & Methods', 'Create custom structs, understand field access, implement methods and associated functions using impl blocks. Practice creating and manipulating struct instances.', 'not_started', 'high', NULL, NULL, 0, '{}', '2025-07-10 03:08:57.550351', '2025-07-10 03:08:57.550351');
INSERT INTO public.tasks VALUES ('2fee45a9-e70', '0b3dfaf1-239', 'Enums & Pattern Matching', 'Learn to define enums, understand variants with and without data. Master pattern matching with match expressions, use if let for simple cases. Practice with Option and custom enums.', 'not_started', 'high', NULL, NULL, 0, '{}', '2025-07-10 03:09:03.969762', '2025-07-10 03:09:03.969762');
INSERT INTO public.tasks VALUES ('47bac106-bb8', '0b3dfaf1-239', 'Collections (Vec, HashMap, String)', 'Work with Vec&lt;T&gt; for dynamic arrays, HashMap&lt;K,V&gt; for key-value storage, and String vs &amp;str. Learn common methods, iteration, and when to use each collection type.', 'not_started', 'high', NULL, NULL, 0, '{}', '2025-07-10 03:09:10.81306', '2025-07-10 03:09:10.81306');
INSERT INTO public.tasks VALUES ('e24cf825-05b', '0b3dfaf1-239', 'Error Handling (Result & Option)', 'Master Result&lt;T,E&gt; and Option&lt;T&gt; types for error handling. Learn to use match, unwrap, expect, and the ? operator. Practice proper error handling patterns and when to use panic!.', 'not_started', 'critical', NULL, NULL, 0, '{}', '2025-07-10 03:09:22.67126', '2025-07-10 03:09:22.67126');
INSERT INTO public.tasks VALUES ('8db47515-ead', '0b3dfaf1-239', 'Lifetimes Introduction', 'Understand basic lifetime annotations with simple examples. Learn why lifetimes exist, how to annotate function parameters and return values, and solve basic lifetime compilation errors.', 'not_started', 'medium', NULL, NULL, 0, '{}', '2025-07-10 03:09:55.088527', '2025-07-10 03:09:55.088527');
INSERT INTO public.tasks VALUES ('a9bc1de3-601', '0b3dfaf1-239', 'Traits & Generics', 'Define custom traits, implement traits for your types, understand trait bounds, and use generic functions and structs. Practice with common traits like Debug, Clone, and PartialEq.', 'not_started', 'high', NULL, NULL, 0, '{}', '2025-07-10 03:10:02.278575', '2025-07-10 03:10:02.278575');
INSERT INTO public.tasks VALUES ('5dd9ae14-4ca', '0b3dfaf1-239', 'Modules & Code Organization', 'Learn to organize code with modules, understand public/private visibility, work with multiple files, and create library vs binary crates. Practice with use statements and module hierarchies.', 'not_started', 'medium', NULL, NULL, 0, '{}', '2025-07-10 03:10:11.44183', '2025-07-10 03:10:11.44183');
INSERT INTO public.tasks VALUES ('ba62889e-e9a', '0b3dfaf1-239', 'File I/O Operations', 'Practice reading from and writing to files using std::fs. Handle file errors properly with Result types, work with different file formats, and understand when to use BufReader/BufWriter.', 'not_started', 'medium', NULL, NULL, 0, '{}', '2025-07-10 03:10:17.12755', '2025-07-10 03:10:17.12755');
INSERT INTO public.tasks VALUES ('98cbe91a-8df', '0b3dfaf1-239', 'Iterators & Closures', 'Master iterator methods like map, filter, collect, and fold. Learn to create closures with different capture modes (move, borrow). Practice functional programming patterns in Rust.', 'not_started', 'high', NULL, NULL, 0, '{}', '2025-07-10 03:10:22.680416', '2025-07-10 03:10:22.680416');
INSERT INTO public.tasks VALUES ('7626728e-a17', '0b3dfaf1-239', 'Smart Pointers (Box, Rc, RefCell)', 'Learn about Box&lt;T&gt; for heap allocation, Rc&lt;T&gt; for reference counting, and RefCell&lt;T&gt; for interior mutability. Understand when and why to use each smart pointer type.', 'not_started', 'medium', NULL, NULL, 0, '{}', '2025-07-10 03:10:29.256104', '2025-07-10 03:10:29.256104');
INSERT INTO public.tasks VALUES ('4d7238ee-ac0', '0b3dfaf1-239', 'Threading & Concurrency', 'Create and manage threads using std::thread. Learn about thread::spawn, join handles, and message passing between threads using channels (mpsc). Practice thread safety concepts.', 'not_started', 'medium', NULL, NULL, 0, '{}', '2025-07-10 03:10:34.541588', '2025-07-10 03:10:34.541588');
INSERT INTO public.tasks VALUES ('3ba894bb-e51', '0b3dfaf1-239', 'Async Programming Basics', 'Learn async/await syntax, understand Future trait, work with async functions and blocks. Practice with tokio runtime and basic async I/O operations.', 'not_started', 'medium', NULL, NULL, 0, '{}', '2025-07-10 03:10:39.622827', '2025-07-10 03:10:39.622827');
INSERT INTO public.tasks VALUES ('11ffa23b-c1a', '0b3dfaf1-239', 'Testing in Rust', 'Write unit tests with #[test] attribute, understand assert! macros, create integration tests, and learn about test organization. Practice test-driven development in Rust.', 'not_started', 'high', NULL, NULL, 0, '{}', '2025-07-10 03:10:45.381292', '2025-07-10 03:10:45.381292');
INSERT INTO public.tasks VALUES ('32bb6622-862', '0b3dfaf1-239', 'Command Line Application', 'Build a command-line application using the clap crate for argument parsing. Practice structuring CLI apps, handling user input, and creating a polished command-line interface.', 'not_started', 'low', NULL, NULL, 0, '{}', '2025-07-10 03:10:52.531763', '2025-07-10 03:10:52.531763');
INSERT INTO public.tasks VALUES ('f24d7a09-25e', '0b3dfaf1-239', 'Simple Web Server', 'Create a simple HTTP server using a lightweight framework like warp or axum. Handle basic routes, serve static content, and understand web development fundamentals in Rust.', 'not_started', 'low', NULL, NULL, 0, '{}', '2025-07-10 03:10:58.852417', '2025-07-10 03:10:58.852417');


--
-- PostgreSQL database dump complete
--

