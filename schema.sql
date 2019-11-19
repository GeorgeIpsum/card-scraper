--
-- PostgreSQL database dump
--

-- Dumped from database version 10.10 (Ubuntu 10.10-0ubuntu0.18.04.1)
-- Dumped by pg_dump version 10.10 (Ubuntu 10.10-0ubuntu0.18.04.1)

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
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: banks; Type: TABLE; Schema: public; Owner: georgeipsum
--

CREATE TABLE public.banks (
    id integer NOT NULL,
    name character varying(1000) NOT NULL,
    defaulturl character varying(1000) NOT NULL,
    queryselector text NOT NULL,
    cardname integer NOT NULL,
    cardpageselector text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.banks OWNER TO georgeipsum;

--
-- Name: banks_id_seq; Type: SEQUENCE; Schema: public; Owner: georgeipsum
--

CREATE SEQUENCE public.banks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.banks_id_seq OWNER TO georgeipsum;

--
-- Name: banks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: georgeipsum
--

ALTER SEQUENCE public.banks_id_seq OWNED BY public.banks.id;


--
-- Name: cards; Type: TABLE; Schema: public; Owner: georgeipsum
--

CREATE TABLE public.cards (
    id integer NOT NULL,
    bankid integer NOT NULL,
    name character varying(1000) NOT NULL,
    defaulturl character varying(1000) NOT NULL,
    spending jsonb,
    travel jsonb,
    entertainment jsonb,
    security jsonb,
    other jsonb
);


ALTER TABLE public.cards OWNER TO georgeipsum;

--
-- Name: cards_id_seq; Type: SEQUENCE; Schema: public; Owner: georgeipsum
--

CREATE SEQUENCE public.cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cards_id_seq OWNER TO georgeipsum;

--
-- Name: cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: georgeipsum
--

ALTER SEQUENCE public.cards_id_seq OWNED BY public.cards.id;


--
-- Name: pgmigrations; Type: TABLE; Schema: public; Owner: georgeipsum
--

CREATE TABLE public.pgmigrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    run_on timestamp without time zone NOT NULL
);


ALTER TABLE public.pgmigrations OWNER TO georgeipsum;

--
-- Name: pgmigrations_id_seq; Type: SEQUENCE; Schema: public; Owner: georgeipsum
--

CREATE SEQUENCE public.pgmigrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pgmigrations_id_seq OWNER TO georgeipsum;

--
-- Name: pgmigrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: georgeipsum
--

ALTER SEQUENCE public.pgmigrations_id_seq OWNED BY public.pgmigrations.id;


--
-- Name: banks id; Type: DEFAULT; Schema: public; Owner: georgeipsum
--

ALTER TABLE ONLY public.banks ALTER COLUMN id SET DEFAULT nextval('public.banks_id_seq'::regclass);


--
-- Name: cards id; Type: DEFAULT; Schema: public; Owner: georgeipsum
--

ALTER TABLE ONLY public.cards ALTER COLUMN id SET DEFAULT nextval('public.cards_id_seq'::regclass);


--
-- Name: pgmigrations id; Type: DEFAULT; Schema: public; Owner: georgeipsum
--

ALTER TABLE ONLY public.pgmigrations ALTER COLUMN id SET DEFAULT nextval('public.pgmigrations_id_seq'::regclass);


--
-- Name: banks banks_pkey; Type: CONSTRAINT; Schema: public; Owner: georgeipsum
--

ALTER TABLE ONLY public.banks
    ADD CONSTRAINT banks_pkey PRIMARY KEY (id);


--
-- Name: cards cards_pkey; Type: CONSTRAINT; Schema: public; Owner: georgeipsum
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_pkey PRIMARY KEY (id);


--
-- Name: pgmigrations pgmigrations_pkey; Type: CONSTRAINT; Schema: public; Owner: georgeipsum
--

ALTER TABLE ONLY public.pgmigrations
    ADD CONSTRAINT pgmigrations_pkey PRIMARY KEY (id);


--
-- Name: cards_bankid_index; Type: INDEX; Schema: public; Owner: georgeipsum
--

CREATE INDEX cards_bankid_index ON public.cards USING btree (bankid);


--
-- Name: cards cards_bankid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: georgeipsum
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_bankid_fkey FOREIGN KEY (bankid) REFERENCES public.banks(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

