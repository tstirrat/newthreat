# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

### Changed

- **web**: Strip `console.log`, `console.info`, and `console.debug` calls from production builds via `esbuild.pure` in `vite.config.ts`. Operational warning signals (`console.warn`) and critical error logging (`console.error`) are intentionally preserved so IndexedDB failures, worker fallbacks, and other production error paths remain observable.
