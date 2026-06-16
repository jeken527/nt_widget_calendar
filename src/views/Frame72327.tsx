import React, { useState, useEffect, useRef } from "react";
import Regionmenu from "@/components/Regionmenu";
import Button1components from "@/components/Button1components";
import Editmenu from "@/components/Editmenu";
import Searchmenu from "@/components/Searchmenu";
import Resetbutton from "@/components/Resetbutton";
import Datecomponents from "@/components/Datecomponents";
import "@/styles/Frame72327.css";

// 👇 이 6줄을 복사해서 여기에 딱 붙여넣어 주세요! 👇
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

const CLIENT_ID = "930243544712-7j81q7c4d7885v43u1nqlmgbdtf85oat.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar";

const HOLIDAY_CALENDARS: Record<string, string> = {
    KR: "ko.south_korea#holiday@group.v.calendar.google.com",
    JP: "ja.japanese#holiday@group.v.calendar.google.com",
    US: "en.usa#holiday@group.v.calendar.google.com"
};

const Frame72327 = () => {
    // 달력 및 상태 관리
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedRegion, setSelectedRegion] = useState("KR");
    const [regionMenuOpen, setRegionMenuOpen] = useState("False");
    
    // 데이터 상태 관리
    const [events, setEvents] = useState<any[]>([]);
    const [holidays, setHolidays] = useState<any[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    // 모달창 상태 관리
    const [eventModalData, setEventModalData] = useState<{ isOpen: boolean; dateStr: string | null }>({ isOpen: false, dateStr: null });
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [newScheduleText, setNewScheduleText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const tokenClientRef = useRef<any>(null);

    // 구글 API 스크립트 로드 및 초기화
    useEffect(() => {
        const loadScripts = () => {
            const gapiScript = document.createElement("script");
            gapiScript.src = "https://apis.google.com/js/api.js";
            gapiScript.onload = () => {
                (window as any).gapi.load("client", async () => {
                    await (window as any).gapi.client.init({});
                    await (window as any).gapi.client.load("calendar", "v3");
                    checkToken();
                });
            };
            document.body.appendChild(gapiScript);

            const gisScript = document.createElement("script");
            gisScript.src = "https://accounts.google.com/gsi/client";
            gisScript.onload = () => {
                tokenClientRef.current = (window as any).google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (resp: any) => {
                        if (resp.error) return;
                        setIsAuthenticated(true);
                        localStorage.setItem("gcal_token", JSON.stringify(resp));
                    },
                });
            };
            document.body.appendChild(gisScript);
        };
        loadScripts();
    }, []);

    const checkToken = () => {
        const token = localStorage.getItem("gcal_token");
        if (token) {
            (window as any).gapi.client.setToken(JSON.parse(token));
            setIsAuthenticated(true);
        }
    };

    // 실시간 캘린더 데이터 패치
    useEffect(() => {
        if (isAuthenticated) fetchCalendarData();
    }, [isAuthenticated, currentDate, selectedRegion]);

    const fetchCalendarData = async () => {
        try {
            const timeMin = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
            const timeMax = new Date(currentDate.getFullYear(), currentDate.getMonth() + 4, 0).toISOString();

            const eventsResp = await (window as any).gapi.client.calendar.events.list({
                calendarId: "primary", timeMin, timeMax, singleEvents: true, orderBy: "startTime",
            });
            setEvents(eventsResp.result.items || []);

            const holidayResp = await (window as any).gapi.client.calendar.events.list({
                calendarId: HOLIDAY_CALENDARS[selectedRegion], timeMin, timeMax, singleEvents: true,
            });
            setHolidays(holidayResp.result.items || []);
        } catch (error: any) {
            if (error.status === 401) setIsAuthenticated(false);
        }
    };

    const handleLogin = () => tokenClientRef.current?.requestAccessToken({ prompt: "consent" });

    const handleAddEvent = async () => {
        if (!newScheduleText.trim() || !eventModalData.dateStr) return;
        try {
            await (window as any).gapi.client.calendar.events.insert({
                calendarId: "primary",
                resource: { summary: newScheduleText, start: { date: eventModalData.dateStr }, end: { date: eventModalData.dateStr } }
            });
            setNewScheduleText("");
            setEventModalData({ isOpen: false, dateStr: null });
            fetchCalendarData();
        } catch (error) {}
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!window.confirm("DELETE SCHEDULE?")) return;
        try {
            await (window as any).gapi.client.calendar.events.delete({ calendarId: "primary", eventId });
            fetchCalendarData();
        } catch (error) {}
    };

    // 날짜 배열 및 상태 생성
    const getGridDates = (year: number, month: number) => {
        const grid = [];
        const startDay = new Date(year, month, 1).getDay();
        const prevEnd = new Date(year, month, 0).getDate();
        const currEnd = new Date(year, month + 1, 0).getDate();

        for (let i = startDay - 1; i >= 0; i--) grid.push({ date: new Date(year, month - 1, prevEnd - i), isCurr: false });
        for (let i = 1; i <= currEnd; i++) grid.push({ date: new Date(year, month, i), isCurr: true });
        let nextDay = 1;
        while (grid.length < 42) grid.push({ date: new Date(year, month + 1, nextDay++), isCurr: false });
        return grid;
    };

    const getDateState = (targetDate: Date, isCurrentMonth: boolean) => {
        if (!isCurrentMonth) return "disable";
        const dateStr = targetDate.toISOString().split("T")[0];
        if (dateStr === new Date().toISOString().split("T")[0]) return "today";
        if (holidays.some(h => (h.start.date || h.start.dateTime?.split("T")[0]) === dateStr)) return "holiday";
        if (events.some(e => (e.start.date || e.start.dateTime?.split("T")[0]) === dateStr)) return "my schedule";
        return "default";
    };

    // 달력 부품 렌더링 헬퍼
    const pStyle = { fontSize: "15px", fontFamily: "Retro Gaming, DungGeunMo, monospace", textAlign: "center" as const, color: "inherit", margin: 0 };
    const renderCell = (item: any, uniqueId: string) => {
        const dState = getDateState(item.date, item.isCurrentMonth);
        const dateStr = item.date.toISOString().split("T")[0];
        const pTag = <p style={pStyle}>{item.date.getDate()}</p>;

        return (
            <div key={uniqueId} onClick={() => item.isCurrentMonth && setEventModalData({ isOpen: true, dateStr })} style={{ cursor: item.isCurrentMonth ? "pointer" : "default", display: "flex" }}>
                <Datecomponents datestates={dState} slot_60_22={pTag} slot_62_37={pTag} slot_62_31={pTag} slot_62_28={pTag} slot_60_25={pTag} slot_135_168={pTag} />
            </div>
        );
    };

    const leftDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const rightDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 1);
    const leftGrid = getGridDates(leftDate.getFullYear(), leftDate.getMonth());
    const rightGrid = getGridDates(rightDate.getFullYear(), rightDate.getMonth());
    
    const searchResults = searchQuery.trim() ? events.filter(e => e.summary?.toLowerCase().includes(searchQuery.toLowerCase())) : [];

    return (
        <div className="scroll-container">
            <div id="72_327" className="stroke-wrapper-72_327">
                <div className="Pixso-frame-72_327">
                    <div className="frame-content-72_327">
                        
                        {/* 헤더 바: 구글 로그인 연동 */}
                        <div id="45_8" className="Pixso-frame-45_8" onClick={handleLogin} style={{ cursor: "pointer" }}>
                            <div className="frame-content-45_8">
                                <div id="129_166" className="Pixso-frame-129_166">
                                    <p id="45_7" className="Pixso-paragraph-45_7" style={{ fontFamily: "Retro Gaming, monospace" }}>
                                        {isAuthenticated ? "CALENDAR CONNECTED" : "CLICK TO LOGIN GOOGLE"}
                                    </p>
                                </div>
                                <div id="8_16" className="Pixso-frame-8_16">
                                    <div className="frame-content-8_16">
                                        <div id="8_12" className="stroke-wrapper-8_12">
                                            <div className="Pixso-frame-8_12">
                                                <div className="frame-content-8_12">
                                                    <div id="10_34" className="stroke-wrapper-10_34">
                                                        <div className="Pixso-rectangle-10_34" style={{ backgroundColor: isAuthenticated ? "#00ff00" : "#ff0000" }}></div>
                                                        <div className="stroke-10_34"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="stroke-8_12"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 메뉴 툴바 */}
                        <div id="52_30" className="Pixso-frame-52_30" style={{ position: 'relative', zIndex: 10 }}>
                            <div className="frame-content-52_30">
                                
                                <div onClick={() => setRegionMenuOpen(prev => prev === "True" ? "False" : "True")} style={{cursor:"pointer", position:"relative"}}>
                                    <Regionmenu id="52_20" className="Pixso-instance-52_20" regionmenu={regionMenuOpen} slot_97_144={<Button1components button1state="default" slot_45_10={<p style={{fontFamily:"Retro Gaming, monospace", fontSize:"15px", margin:0}}>{selectedRegion}</p>}/>} />
                                    {regionMenuOpen === "True" && (
                                        <div style={{ position: "absolute", top: "30px", left: "0", display:"flex", flexDirection:"column", background:"#ddd", border:"2px solid #000", padding:"4px", gap:"4px" }}>
                                            {["KR", "JP", "US"].map(reg => (
                                                <div key={reg} onClick={(e) => { e.stopPropagation(); setSelectedRegion(reg); setRegionMenuOpen("False"); }} style={{cursor:"pointer", padding:"2px 8px", fontFamily:"Retro Gaming, monospace", fontSize:"14px", borderBottom:"1px solid #000"}}>{reg}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Editmenu id="52_23" className="Pixso-instance-52_23" editmenu="False" />
                                
                                {/* 검색 버튼 -> 검색 모달 오픈 */}
                                <div onClick={() => setSearchModalOpen(true)} style={{cursor:"pointer"}}>
                                    <Searchmenu id="52_26" className="Pixso-instance-52_26" searchmenu="False" />
                                </div>
                                
                                {/* 리셋 버튼 -> 이번달, 한국 리셋 */}
                                <div onClick={() => { setCurrentDate(new Date()); setSelectedRegion("KR"); setSearchQuery(""); }} style={{cursor:"pointer"}}>
                                    <Resetbutton id="52_28" className="Pixso-instance-52_28" resetmenu="default" />
                                </div>

                            </div>
                        </div>

                        {/* 메인 달력 프레임 */}
                        <div id="68_326" className="stroke-wrapper-68_326">
                            <div className="Pixso-frame-68_326">
                                <div className="frame-content-68_326">
                                    
                                    {/* 1. 왼쪽 캘린더 (이번 달 기준) */}
                                    <div id="66_206" className="Pixso-frame-66_206">
                                        <div className="frame-content-66_206">
                                            <div id="66_205" className="Pixso-frame-66_205">
                                                <div className="frame-content-66_205">
                                                    <div id="66_201" className="Pixso-frame-66_201"><div className="frame-content-66_201"><p id="66_198" className="Pixso-paragraph-66_198" style={{fontFamily:"Retro Gaming, monospace"}}>{leftDate.getFullYear()}</p></div></div>
                                                    <div id="66_202" className="Pixso-frame-66_202"><div className="frame-content-66_202"><p id="66_203" className="Pixso-paragraph-66_203" style={{fontFamily:"Retro Gaming, monospace"}}>{String(leftDate.getMonth() + 1).padStart(2, '0')}</p></div></div>
                                                </div>
                                            </div>
                                            <div id="64_170" className="Pixso-frame-64_170">
                                                <div className="frame-content-64_170">
                                                    <div id="64_78" className="Pixso-frame-64_78">
                                                        <div className="frame-content-64_78">{["S", "M", "T", "W", "T", "F", "S"].map((c, i) => <Datecomponents key={i} datestates="day" slot_62_34={<p style={pStyle}>{c}</p>} />)}</div>
                                                    </div>
                                                    {[0, 1, 2, 3, 4, 5].map(wIdx => (
                                                        <div key={wIdx} className="Pixso-frame-64_79">
                                                            <div className="frame-content-64_79">{leftGrid.slice(wIdx * 7, (wIdx + 1) * 7).map((item, dIdx) => renderCell(item, `L-${wIdx}-${dIdx}`))}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div id="68_322" className="Pixso-vector-68_322"></div>

                                    {/* 2. 오른쪽 캘린더 (2달 뒤 고정) */}
                                    <div id="68_321" className="Pixso-frame-68_321">
                                        <div className="frame-content-68_321">
                                            <div id="66_320" className="Pixso-frame-66_320">
                                                <div className="frame-content-66_320">
                                                    <div onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} style={{cursor:"pointer"}}><Button1components button1state="default" slot_45_10={<p style={pStyle}>{"<"}</p>} /></div>
                                                    <div id="66_208" className="Pixso-frame-66_208">
                                                        <div className="frame-content-66_208">
                                                            <div id="66_209" className="Pixso-frame-66_209"><div className="frame-content-66_209"><p id="66_210" className="Pixso-paragraph-66_210" style={{fontFamily:"Retro Gaming, monospace"}}>{rightDate.getFullYear()}</p></div></div>
                                                            <div id="66_211" className="Pixso-frame-66_211"><div className="frame-content-66_211"><p id="66_212" className="Pixso-paragraph-66_212" style={{fontFamily:"Retro Gaming, monospace"}}>{String(rightDate.getMonth() + 1).padStart(2, '0')}</p></div></div>
                                                        </div>
                                                    </div>
                                                    <div onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} style={{cursor:"pointer"}}><Button1components button1state="default" slot_45_10={<p style={pStyle}>{">"}</p>} /></div>
                                                </div>
                                            </div>
                                            <div id="66_213" className="Pixso-frame-66_213">
                                                <div className="frame-content-66_213">
                                                    <div id="66_214" className="Pixso-frame-66_214">
                                                        <div className="frame-content-66_214">{["S", "M", "T", "W", "T", "F", "S"].map((c, i) => <Datecomponents key={i} datestates="day" slot_62_34={<p style={pStyle}>{c}</p>} />)}</div>
                                                    </div>
                                                    {[0, 1, 2, 3, 4, 5].map(wIdx => (
                                                        <div key={wIdx} className="Pixso-frame-66_222">
                                                            <div className="frame-content-66_222">{rightGrid.slice(wIdx * 7, (wIdx + 1) * 7).map((item, dIdx) => renderCell(item, `R-${wIdx}-${dIdx}`))}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="stroke-68_326"></div>
                        </div>

                    </div>
                </div>
                <div className="stroke-72_327"></div>
            </div>

            {/* --- 공통 레트로 모달 배경 --- */}
            {(eventModalData.isOpen || searchModalOpen) && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
                    
                    {/* 기능 A: 일정 관리 팝업 */}
                    {eventModalData.isOpen && (
                        <div style={{ backgroundColor: "#ddd", border: "4px solid #000", padding: "16px", width: "320px", fontFamily: "Retro Gaming, DungGeunMo, monospace", boxShadow: "8px 8px 0px rgba(0,0,0,0.8)" }}>
                            <div style={{ backgroundColor: "#000", color: "#fff", padding: "4px 8px", marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "14px" }}>DATE : {eventModalData.dateStr}</span>
                                <span onClick={() => setEventModalData({ isOpen: false, dateStr: null })} style={{ cursor: "pointer" }}>[X]</span>
                            </div>
                            <div style={{ minHeight: "60px", backgroundColor: "#fff", border: "2px solid #000", padding: "8px", marginBottom: "12px", maxHeight: "150px", overflowY: "auto", fontSize: "14px" }}>
                                {events.filter(e => (e.start.date || e.start.dateTime?.split("T")[0]) === eventModalData.dateStr).map((e, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", margin: "4px 0", borderBottom: "1px dashed #ccc" }}>
                                        <span>- {e.summary}</span>
                                        <span onClick={() => handleDeleteEvent(e.id)} style={{ cursor: "pointer", color: "red" }}>[DEL]</span>
                                    </div>
                                ))}
                            </div>
                            <input type="text" placeholder="NEW SCHEDULE..." value={newScheduleText} onChange={(e) => setNewScheduleText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()} style={{ width: "93%", padding: "6px", border: "2px solid #000", outline: "none", fontFamily: "inherit" }} />
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                                <button onClick={handleAddEvent} style={{ padding: "4px 12px", border: "2px solid #000", background: "#fff", cursor: "pointer", fontFamily: "inherit", boxShadow: "2px 2px 0px #000" }}>SAVE</button>
                            </div>
                        </div>
                    )}

                    {/* 기능 B: 일정 검색 전용 팝업 (아이디어 B 채택) */}
                    {searchModalOpen && (
                        <div style={{ backgroundColor: "#ddd", border: "4px solid #000", padding: "16px", width: "350px", fontFamily: "Retro Gaming, DungGeunMo, monospace", boxShadow: "8px 8px 0px rgba(0,0,0,0.8)" }}>
                            <div style={{ backgroundColor: "#000", color: "#fff", padding: "4px 8px", marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "14px" }}>SEARCH RESULT</span>
                                <span onClick={() => setSearchModalOpen(false)} style={{ cursor: "pointer" }}>[X]</span>
                            </div>
                            <input autoFocus type="text" placeholder="TYPE KEYWORD..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "94%", padding: "6px", border: "2px solid #000", outline: "none", fontFamily: "inherit", marginBottom: "12px", backgroundColor: "#fff" }} />
                            <div style={{ minHeight: "100px", backgroundColor: "#fff", border: "2px inset #000", padding: "8px", maxHeight: "150px", overflowY: "auto", fontSize: "14px" }}>
                                {searchQuery.trim() === "" ? (
                                    <span style={{ color: "#888" }}>Waiting for input...</span>
                                ) : searchResults.length === 0 ? (
                                    <span style={{ color: "red" }}>NO DATA FOUND.</span>
                                ) : (
                                    searchResults.map((e, i) => (
                                        <div key={i} style={{ margin: "4px 0", borderBottom: "1px dashed #ccc", paddingBottom: "2px" }}>
                                            <span style={{ color: "blue", marginRight: "6px" }}>[{e.start.date || e.start.dateTime?.split("T")[0]}]</span>
                                            {e.summary}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Frame72327;
