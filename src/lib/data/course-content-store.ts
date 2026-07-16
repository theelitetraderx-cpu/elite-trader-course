import { getInitialPrograms, type CourseProgram } from "@/lib/data/course-hierarchy";

import { readJsonFile, writeJsonFile } from "@/lib/data/persist";

import {

  fetchProgramsFromSupabase,

  saveProgramsToSupabase,

  seedProgramsIfEmpty,

  isSupabaseDataEnabled,

} from "@/lib/supabase/app-data";



const PROGRAMS_FILE = "programs.json";



declare global {

  // eslint-disable-next-line no-var

  var __eliteCoursePrograms: CourseProgram[] | undefined;

  // eslint-disable-next-line no-var

  var __eliteProgramsLoaded: boolean | undefined;

}



function loadProgramsFromFile(): CourseProgram[] {

  const saved = readJsonFile<CourseProgram[]>(PROGRAMS_FILE);

  if (saved?.length) return saved;

  const initial = getInitialPrograms();

  writeJsonFile(PROGRAMS_FILE, initial);

  return initial;

}



function countProgramContent(programs: CourseProgram[]): number {

  return programs.reduce((total, program) => {

    return (

      total +

      program.modules.reduce(

        (modTotal, mod) =>

          modTotal + mod.videos.length + mod.ppts.length + mod.notes.length,

        0

      )

    );

  }, 0);

}



function pickPrograms(local: CourseProgram[], remote: CourseProgram[] | null): CourseProgram[] {

  if (!remote?.length) return local;

  const localContent = countProgramContent(local);

  const remoteContent = countProgramContent(remote);

  return remoteContent > localContent ? remote : local;

}



export async function ensureProgramsLoaded(): Promise<void> {

  await seedProgramsIfEmpty();



  const local = loadProgramsFromFile();

  const fromSupabase = isSupabaseDataEnabled()

    ? await fetchProgramsFromSupabase()

    : null;



  const programs = pickPrograms(local, fromSupabase);



  global.__eliteCoursePrograms = programs;

  global.__eliteProgramsLoaded = true;



  // Keep local file in sync when Supabase had richer data

  if (fromSupabase && programs === fromSupabase) {

    writeJsonFile(PROGRAMS_FILE, programs);

  }

}



/** Force reload from disk / Supabase (e.g. after admin saves in another process) */

export async function reloadPrograms(): Promise<CourseProgram[]> {

  global.__eliteProgramsLoaded = false;

  global.__eliteCoursePrograms = undefined;

  await ensureProgramsLoaded();

  return getPrograms();

}



export function getPrograms(): CourseProgram[] {

  if (!global.__eliteCoursePrograms) {

    global.__eliteCoursePrograms = loadProgramsFromFile();

  }

  return global.__eliteCoursePrograms;

}



export async function setPrograms(programs: CourseProgram[]): Promise<CourseProgram[]> {

  global.__eliteCoursePrograms = programs;

  global.__eliteProgramsLoaded = true;

  writeJsonFile(PROGRAMS_FILE, programs);



  if (isSupabaseDataEnabled()) {

    await saveProgramsToSupabase(programs);

  }



  return global.__eliteCoursePrograms;

}



export function getProgramByCourseId(courseId: string): CourseProgram | null {

  return getPrograms().find((p) => p.id === courseId) ?? null;

}

