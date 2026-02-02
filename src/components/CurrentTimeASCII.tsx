import { createMemo, createSignal, onCleanup, type Component } from "solid-js";

type TimeOfDay = "night" | "sunrise" | "noon" | "sunset";

const ASCII_ART: Record<TimeOfDay, string> = {
  night: `
      *         *                     *         *                  *   
                       *       @@@@@@@@@@@@                *           
      *      *               @@@@@@@@@@@@@@@@        *          *      
                   *        @@@@@@@@@@@@@@@@@@   *                     
       *                   @@@@@@@@@@@@@@@@@@@@             *        * 
           *       *       @@@@@@@@@@@@@@@@@@@@      *                 
     *        *             @@@@@@@@@@@@@@@@@@              *          
         *           *       @@@@@@@@@@@@@@@@       *              *   
                *              @@@@@@@@@@@@       *           *        
       *               *                             *                 
               *                         *                   *         
~~~~~~~~~~~~~ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~~~~  ~~~~~~~~~~~~
 ~     *    ~~   ~  ~   *    ~~~~~~~~~~~~~~~~~~~~ ~     *  ~~  *   ~~ ~
   ~    *  ~~    *  ~~ ~~ ~~ * ~~~~~~~~~~~~~ ~~~~  ~   *  ~~~   * ~ ~~~  
`,
  sunrise: `
            ~~            ~~        ~~        ~~      ~~       ~~            
                ~~           ~~     ~~     ~~              ~~          
         ~~       ~~~~;         ~~  ~~  ~~           ;~~~~             
           ~~~;        ~~~~;                   ;~~~~       ;~~~         
     ~~        ~~~~;       ~~~ @@@@@@@@@@@@ ~~~       ;~~~~    ~~      
         ~~~        ~~~;     @@@@@@@@@@@@@@@@     ;~~~     ~~~         
               ~~~      ~~~ @@@@@@@@@@@@@@@@@@ ~~~    ~~~         ^^   
            ^^             @@@@@@@@@@@@@@@@@@@@                        
______________ ____________&&&&&&&&&&&&&&&&&&&&___________ ____________
 ~         ~~   ~  ~       ~~~~~~~~~~~~~~~~~~~~ ~       ~~     ~~ ~    
   ~      ~~      ~~ ~~ ~~  ~~~~~~~~~~~~~ ~~~~  ~     ~~~    ~ ~~~  ~ ~
   ~  ~~     ~         ~      ~~~~~~  ~~ ~~~       ~~ ~ ~~  ~~ ~       
 ~  ~       ~ ~      ~           ~~ ~~~~~~  ~      ~~  ~             ~~
       ~             ~        ~      ~      ~~   ~             ~       
`,
  noon: `
       ^^             ^^                         ^^                    
                               @@@@@@@@@@@@                            
             ^^              @@@@@@@@@@@@@@@@                 ^^       
     ^^                     @@@@@@@@@@@@@@@@@@           ^^            
                ^^         @@@@@@@@@@@@@@@@@@@@                        
                           @@@@@@@@@@@@@@@@@@@@     ^^                 
      ^^                    @@@@@@@@@@@@@@@@@@                ^^       
                             @@@@@@@@@@@@@@@@                          
              ^^               @@@@@@@@@@@@              ^^            
                                                                       
                                                                       
~~~~~~~~~~~~~ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ~~~~~~~  ~~~~~~~~~~~~
 ~     *    ~~   ~  ~   *    ~~~~~~~~~~~~~~~~~~~~ ~     *  ~~  *   ~~ ~
   ~    *  ~~    *  ~~ ~~ ~~ * ~~~~~~~~~~~~~ ~~~~  ~   *  ~~~   * ~ ~~~  
`,
  sunset: `
        ^^                  ^^                                         
                                      ^^                     ^^        
                ^^                                     ^^              
                       ^^                                              
                                 @@@@@@@@@        ^^                   
       ^^       ^^            @@@@@@@@@@@@@@@                          
                            @@@@@@@@@@@@@@@@@@              ^^         
                           @@@@@@@@@@@@@@@@@@@@                        
~~~~~ ~~ ~~~~~ ~~~~~~~~ ~~ &&&&&&&&&&&&&&&&&&&& ~~~~~~~ ~~~~~~~~~~~ ~~~
 ~         ~~   ~  ~       ~~~~~~~~~~~~~~~~~~~~ ~       ~~     ~~ ~    
   ~      ~~      ~~ ~~ ~~  ~~~~~~~~~~~~~ ~~~~  ~     ~~~    ~ ~~~  ~ ~
   ~  ~~     ~         ~      ~~~~~~  ~~ ~~~       ~~ ~ ~~  ~~ ~       
 ~  ~       ~ ~      ~           ~~ ~~~~~~  ~      ~~  ~             ~~
       ~             ~        ~      ~      ~~   ~             ~       
`,
};

const TIME_RANGES: { start: number; end: number; period: TimeOfDay }[] = [
  { start: 0, end: 6, period: "night" },
  { start: 6, end: 11, period: "sunrise" },
  { start: 11, end: 17, period: "noon" },
  { start: 17, end: 20, period: "sunset" },
  { start: 20, end: 24, period: "night" },
];

const TIME_OF_DAY_ORDER: TimeOfDay[] = ["night", "sunrise", "noon", "sunset"];

const getPoznanTime = (): Date => {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Warsaw" }),
  );
};

const getTimeOfDay = (date: Date): TimeOfDay => {
  const hour = date.getHours();
  const range = TIME_RANGES.find((r) => hour >= r.start && hour < r.end);
  return range?.period ?? "night";
};

const formatPoznanTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const CurrentTimeASCII: Component = () => {
  const [currentTime, setCurrentTime] = createSignal(getPoznanTime());
  const [manualPeriod, setManualPeriod] = createSignal<TimeOfDay | null>(null);

  const interval = setInterval(() => {
    setCurrentTime(getPoznanTime());
  }, 1000);

  onCleanup(() => clearInterval(interval));

  const currentPeriod = createMemo(() => {
    const manual = manualPeriod();
    if (manual) return manual;
    return getTimeOfDay(currentTime());
  });

  const currentArt = createMemo(() => ASCII_ART[currentPeriod()]);

  const cyclePeriod = () => {
    const current = manualPeriod() ?? getTimeOfDay(currentTime());
    const currentIndex = TIME_OF_DAY_ORDER.indexOf(current);
    const nextIndex = (currentIndex + 1) % TIME_OF_DAY_ORDER.length;
    setManualPeriod(TIME_OF_DAY_ORDER[nextIndex]);
  };

  const resetToAuto = () => {
    setManualPeriod(null);
  };

  const isManual = createMemo(() => manualPeriod() !== null);

  return (
    <div class="font-mono text-sm">
      <div class="mb-2 flex items-center justify-between gap-4"></div>
      <pre class="text-foreground overflow-x-auto text-xs leading-tight whitespace-pre">
        {currentArt()}
      </pre>
      <div class="text-muted-foreground mt-4 flex items-center justify-start gap-4 text-xs md:justify-center">
        <span class="text-primary font-semibold">Poznań, Poland</span>
        {" — "}
        <span class="text-primary tabular-nums">
          {formatPoznanTime(currentTime())}
        </span>
        <div class="flex gap-2">
          <button
            type="button"
            onClick={cyclePeriod}
            class="border-border bg-background text-foreground hover:bg-muted flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors"
            title="Cycle through times of day"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon icon-tabler icons-tabler-outline icon-tabler-rotate"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M19.95 11a8 8 0 1 0 -.5 4m.5 5v-5h-5" />
            </svg>
            {currentPeriod()}
          </button>
          {isManual() && (
            <button
              type="button"
              onClick={resetToAuto}
              class="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground rounded border px-2 py-1 text-xs transition-colors"
              title="Reset to current time"
            >
              reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentTimeASCII;
