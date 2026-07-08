import Regionmenu from "@/components/Regionmenu";
import { useState, useEffect, useRef } from "react";
import Button1components from "@/components/Button1components";
import Button2components from "@/components/Button2components";
import Button3components from "@/components/Button3components";
import Editmenu from "@/components/Editmenu";
import Searchmenu from "@/components/Searchmenu";
import Resetbutton from "@/components/Resetbutton";
import Datecomponents from "@/components/Datecomponents";
import Dateselectbutton1 from "@/components/Dateselectbutton1";
import Dateselectbutton2 from "@/components/Dateselectbutton2";

import "@/styles/Frame72327.css";
import "@/styles/Frame107433.css"; 
import "@/styles/Frame97172.css"; 
import "@/styles/Frame120147.css"; 

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
const SCOPES = "https://www.googleapis.com/auth/calendar";

const HOLIDAY_CALENDARS: Record<string, string> = {
    KR: "ko.south_korea#holiday@group.v.calendar.google.com",
    JP: "ja.japanese#holiday@group.v.calendar.google.com",
    US: "en.usa#holiday@group.v.calendar.google.com"
};

const Frame72327 = () => {
    const [regionmenu_52_20, setRegionmenu_52_20] = useState("False");
    const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);

    const today = new Date();
    const leftDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const [rightDate, setRightDate] = useState(new Date(today.getFullYear(), today.getMonth() + 1, 1));

    const [selectedRegion, setSelectedRegion] = useState("KR");
    const [myCalendarId, setMyCalendarId] = useState("primary");
    const [holidays, setHolidays] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]); 
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const tokenClientRef = useRef<any>(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [eventTitle, setEventTitle] = useState("");
    const [eventStartDate, setEventStartDate] = useState("");
    const [eventEndDate, setEventEndDate] = useState("");
    const [eventMemo, setEventMemo] = useState("");

    const [viewModalData, setViewModalData] = useState<{ isOpen: boolean; eventId?: string; title: string; isHoliday: boolean }>({ isOpen: false, title: "", isHoliday: false });
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchResults = searchQuery.trim() 
        ? [...events, ...holidays]
            .filter(e => (e.summary || "").toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                const dateA = a.start?.date || a.start?.dateTime || "";
                const dateB = b.start?.date || b.start?.dateTime || "";
                return dateA.localeCompare(dateB); 
            })
        : [];

    const getLocalDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isDateCovered = (targetDateStr: string, event: any) => {
        const start = event.start?.date || event.start?.dateTime?.substring(0, 10);
        const end = event.end?.date || event.end?.dateTime?.substring(0, 10);
        if (!start) return false;
        if (event.end?.date) {
            if (start === end) return targetDateStr === start;
            return targetDateStr >= start && targetDateStr < end;
        } else {
            if (!end) return targetDateStr === start;
            return targetDateStr >= start && targetDateStr <= end;
        }
    };

    useEffect(() => {
        const loadScripts = () => {
            const gapiScript = document.createElement("script");
            gapiScript.src = "https://apis.google.com/js/api.js";
            gapiScript.onload = () => {
                window.gapi.load("client", async () => {
                    await window.gapi.client.init({});
                    await window.gapi.client.load("calendar", "v3");
                    checkToken();
                });
            };
            document.body.appendChild(gapiScript);

            const gisScript = document.createElement("script");
            gisScript.src = "https://accounts.google.com/gsi/client";
            gisScript.onload = () => {
                tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
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
            window.gapi.client.setToken(JSON.parse(token));
            setIsAuthenticated(true);
        }
    };

    useEffect(() => {
        if (isAuthenticated) fetchCalendarData();
    }, [isAuthenticated, rightDate, selectedRegion]); 

    const fetchCalendarData = async () => {
        try {
            const calListResp = await window.gapi.client.calendar.calendarList.list();
            const targetCal = calListResp.result.items?.find((c: any) => c.summary === "정경");
            const targetId = targetCal ? targetCal.id : "primary";
            setMyCalendarId(targetId);

            const timeMin = new Date(leftDate.getFullYear(), leftDate.getMonth(), 1).toISOString();
            const timeMax = new Date(rightDate.getFullYear(), rightDate.getMonth() + 4, 0).toISOString();
            
            const holidayResp = await window.gapi.client.calendar.events.list({
                calendarId: HOLIDAY_CALENDARS[selectedRegion], timeMin, timeMax, singleEvents: true,
            });
            setHolidays(holidayResp.result.items || []);

            const eventsResp = await window.gapi.client.calendar.events.list({
                calendarId: targetId, timeMin, timeMax, singleEvents: true, orderBy: "startTime"
            });
            setEvents(eventsResp.result.items || []);
        } catch (error: any) {
            if (error.status === 401) setIsAuthenticated(false);
        }
    };

    const handleLogin = () => tokenClientRef.current?.requestAccessToken({ prompt: "consent" });

    const handleSaveEvent = async () => {
        if (!eventTitle.trim() || !eventStartDate) return;
        try {
            let targetEndDate = eventEndDate || eventStartDate;
            const d = new Date(targetEndDate);
            d.setDate(d.getDate() + 1); 
            const googleExclusiveEnd = getLocalDateStr(d);

            await window.gapi.client.calendar.events.insert({
                calendarId: myCalendarId,
                resource: { 
                    summary: eventTitle, 
                    description: eventMemo, 
                    start: { date: eventStartDate }, 
                    end: { date: googleExclusiveEnd } 
                }
            });
            setEventTitle(""); setEventStartDate(""); setEventEndDate(""); setEventMemo("");
            setIsAddModalOpen(false);
            fetchCalendarData();
        } catch (error) {}
    };

    const executeDelete = async () => {
    if (!deleteConfirmId) return; // ID가 없으면 취소
    try {
        await window.gapi.client.calendar.events.delete({ calendarId: myCalendarId, eventId: deleteConfirmId });
        setViewModalData({ isOpen: false, title: "", isHoliday: false });
        setDeleteConfirmId(null); // 삭제 후 확인 모달 닫기
        fetchCalendarData();
    } catch (error) {}
};

    const openAddModal = (dateStr: string) => {
        setEventStartDate(dateStr); setEventEndDate(dateStr); setIsAddModalOpen(true);
    };

    const getGridDates = (year: number, month: number) => {
        const grid = [];
        const startDay = new Date(year, month, 1).getDay();
        const prevEnd = new Date(year, month, 0).getDate();
        const currEnd = new Date(year, month + 1, 0).getDate();

        for (let i = startDay - 1; i >= 0; i--) grid.push({ date: new Date(year, month - 1, prevEnd - i), isCurrentMonth: false });
        for (let i = 1; i <= currEnd; i++) grid.push({ date: new Date(year, month, i), isCurrentMonth: true });
        let nextDay = 1;
        while (grid.length < 42) grid.push({ date: new Date(year, month + 1, nextDay++), isCurrentMonth: false });
        return grid;
    };

    const getDateState = (targetDate: Date, isCurrentMonth: boolean) => {
        if (!isCurrentMonth) return "disable";
        const dateStr = getLocalDateStr(targetDate);
        const todayStr = getLocalDateStr(new Date());

        if (holidays.some(h => isDateCovered(dateStr, h))) return "holiday";
        if (events.some(e => isDateCovered(dateStr, e))) return "my schedule";
        if (dateStr === todayStr) return "today";
        return "default";
    };

    const pStyle = { fontFamily: "Retro Gaming, DungGeunMo, monospace", fontSize: "15px", margin: 0, textAlign: "center" as const };
    
    const getPClass = (state: string) => {
        switch(state) {
            case "disable": return "Pixso-paragraph-2_5";
            case "holiday": return "Pixso-paragraph-2_179";
            case "my schedule": return "Pixso-paragraph-2_175";
            case "today": return "Pixso-paragraph-2_169";
            default: return "Pixso-paragraph-2_155";
        }
    };

    const renderDateComponent = (vState: string, pClass: string, day: string) => (
        <Datecomponents datestates={vState} slot_60_22={<p className={pClass} style={pStyle}>{day}</p>} slot_62_37={<p className={pClass} style={pStyle}>{day}</p>} slot_62_31={<p className={pClass} style={pStyle}>{day}</p>} slot_62_28={<p className={pClass} style={pStyle}>{day}</p>} slot_60_25={<p className={pClass} style={pStyle}>{day}</p>} slot_135_168={<p className={pClass} style={pStyle}>{day}</p>} />
    );

    const renderCell = (item: any, uniqueKey: string) => {
        const day = String(item.date.getDate());
        const dateStr = getLocalDateStr(item.date);
        
        if (!item.isCurrentMonth) {
            return <div key={uniqueKey} style={{ display: "contents" }}>{renderDateComponent("disable", getPClass("disable"), day)}</div>;
        }
        
        const state = getDateState(item.date, true);
        const pClass = getPClass(state);
        const visualState = (hoveredDateStr === dateStr) ? "checked" : state; 
        
        const handleClick = (e: any) => {
            e.stopPropagation();
            if (state === "holiday") {
                const hol = holidays.find(h => isDateCovered(dateStr, h));
                setViewModalData({ isOpen: true, title: hol?.summary || "공휴일", isHoliday: true }); 
            } else if (state === "my schedule") {
                const evnt = events.find(e => isDateCovered(dateStr, e));
                setViewModalData({ isOpen: true, eventId: evnt?.id, title: evnt?.summary || "일정", isHoliday: false }); 
            } else {
                openAddModal(dateStr);
            }
        };

        return (
            <div key={uniqueKey} onClick={handleClick} onMouseEnter={() => setHoveredDateStr(dateStr)} onMouseLeave={() => setHoveredDateStr(null)} style={{ cursor: "pointer", display: "contents" }}>
                {state === "holiday" ? (
                    <Dateselectbutton2 dateselectnew2="holiday" slot_146_537={renderDateComponent(visualState, pClass, day)} />
                ) : state === "my schedule" ? (
                    <Dateselectbutton2 dateselectnew2="my schedule" slot_146_536={renderDateComponent(visualState, pClass, day)} />
                ) : state === "today" ? (
                    <Dateselectbutton1 dateselectbutton="today" slot_146_414={renderDateComponent(visualState, pClass, day)} />
                ) : (
                    <Dateselectbutton1 dateselectbutton="default" slot_146_413={renderDateComponent(visualState, pClass, day)} />
                )}
            </div>
        );
    };

    const leftGrid = getGridDates(leftDate.getFullYear(), leftDate.getMonth());
    const rightGrid = getGridDates(rightDate.getFullYear(), rightDate.getMonth());

    const rowIdsL = ["64_79", "64_95", "64_110", "64_125", "64_140", "64_155"];
    const rowIdsR = ["66_222", "66_230", "66_238", "66_246", "66_254", "66_262"];
    const DayHeader = ({ cId, pId, text }: { cId: string, pId: string, text: string }) => (
        <Datecomponents id={cId} className={`Pixso-instance-${cId}`} datestates="day" slot_62_34={<p id={pId} className={`Pixso-paragraph-${pId}`} style={{margin: 0}}>{text}</p>} />
    );

    return (
        <div className="scroll-container" style={{ position: "relative" }}>
            
            <style>{`
                .hover-target { display: contents; }
                .hover-target > * { cursor: pointer !important; pointer-events: auto !important; }
                
                /* 🎯 1. 안쪽 그림자(X 2, Y 2, Blur 1) + 배경색(#B0B0B0) + 우하단 흰색 테두리 동시 적용 클래스 */
                .hover-shadow-color:hover > * {
                    position: relative;
                }
                .hover-shadow-color:hover > *::after {
                    content: "";
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    /* ✨ 마법의 코드: 콤마(,)를 사용해 좌상단 어두운 그림자와 우하단 하얀색 테두리를 동시에 그립니다! */
                    box-shadow: inset 2px 2px 1px 0px rgba(0, 0, 0, 0.6), inset -1px -1px 0px 0px #FFFFFF !important;
                    pointer-events: none;
                    z-index: 9999;
                }
                .hover-shadow-color:hover > div > [class*="Pixso-symbol"], 
                .hover-shadow-color:hover > [class*="Pixso-symbol"],
                .hover-shadow-color:hover [class*="Pixso-symbol"] { 
                    background-color: #B0B0B0 !important; 
                }

                /* 🎯 2. 드롭다운용: 배경색(#B0B0B0)만 변경 클래스 */
                /* 글자 크기로 쪼그라들지 못하게 너비를 110px(상자 안쪽 크기)로 멱살 잡고 고정! */
.hover-color {
    width: 110px !important; 
}
.hover-color [class*="Pixso-instance"],
.hover-color [class*="Pixso-symbol"] {
    width: 100% !important;
    box-sizing: border-box !important;
}

/* 마우스를 올렸을 때의 호버 색상 변화 */
.hover-color:hover > div > [class*="Pixso-symbol"], 
.hover-color:hover > [class*="Pixso-symbol"],
.hover-color:hover [class*="Pixso-symbol"] { 
    background-color: #B0B0B0 !important; 
}

                /* 🎯 3. OK 버튼용: 어두운 배경색(#4B4B4B) + 글자색 흰색 변경 클래스 */
                .hover-dark:hover > div > [class*="Pixso-symbol"], 
                .hover-dark:hover > [class*="Pixso-symbol"],
                .hover-dark:hover [class*="Pixso-symbol"] { 
                    background-color: #4B4B4B !important; 
                }
                .hover-dark:hover p { 
                    color: #ffffff !important; 
                }

                .z-40 { position: relative !important; z-index: 40 !important; }
                .z-30 { position: relative !important; z-index: 30 !important; }
                .z-20 { position: relative !important; z-index: 20 !important; }
                .z-10 { position: relative !important; z-index: 10 !important; }

                /* 🎯 4. 월 이동 버튼 전용: 호버 시 바깥쪽 그림자(box-shadow) 완벽 제거 */
.hide-outer-shadow:hover > div > [class*="Pixso-symbol"], 
.hide-outer-shadow:hover > [class*="Pixso-symbol"],
.hide-outer-shadow:hover [class*="Pixso-symbol"] { 
    box-shadow: none !important; 
}

/* 혹시 피그마에서 그림자가 별도의 투명 레이어로 렌더링되었을 경우를 대비한 보험 */
.hide-outer-shadow:hover .shadow-blend-unknown-0 {
    display: none !important;
}
            `}</style>

            <div id="72_327" className="stroke-wrapper-72_327">
                <div className="Pixso-frame-72_327">
                    <div className="frame-content-72_327">
                        
                        {/* 메인 프레임 타이틀 바 */}
                        <div id="45_8" className="Pixso-frame-45_8" style={{ cursor: "default", zIndex: 9999, position: "relative" }}>
                            <div className="frame-content-45_8" style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                                
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={handleLogin}>
                                    <div id="129_166" className="Pixso-frame-129_166" style={{ padding: 0, margin: 0 }}>
                                        <p id="45_7" className="Pixso-paragraph-45_7" style={{ fontFamily: "Retro Gaming, DungGeunMo, monospace", margin: 0, paddingLeft: "6px" }}>
                                            CALENDAR
                                        </p>
                                    </div>
                                    <div id="10_34" className="stroke-wrapper-10_34" style={{ width: "12px", height: "12px", position: "relative", marginLeft: "4px" }}>
                                        <div className="Pixso-rectangle-10_34" style={{ position: "absolute", inset: 0, backgroundColor: isAuthenticated ? "#ff0000" : "#555555" }}></div>
                                        <div className="stroke-10_34" style={{ position: "absolute", inset: 0, border: "1px solid #fff", borderTopColor: "#000", borderLeftColor: "#000" }}></div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "2px" }}>
                                    <div className="stroke-wrapper-8_14" style={{ width: "22px", height: "22px", position: "relative", backgroundColor: "#ddd", display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
                                        <img src="/Line1.svg" alt="minimize" style={{ width: "12px", height: "12px" }} />
                                        <div className="stroke-8_14" style={{ position: "absolute", inset: 0, border: "1px solid #000", borderTopColor: "#fff", borderLeftColor: "#fff" }}></div>
                                    </div>
                                    <div className="stroke-wrapper-8_14" style={{ width: "22px", height: "22px", position: "relative", backgroundColor: "#ddd", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                        <img src="/Rectangle1.svg" alt="maximize" style={{ width: "12px", height: "12px" }} />
                                        <div className="stroke-8_14" style={{ position: "absolute", inset: 0, border: "1px solid #000", borderTopColor: "#fff", borderLeftColor: "#fff" }}></div>
                                    </div>
                                    <div className="stroke-wrapper-8_14" style={{ width: "22px", height: "22px", position: "relative", backgroundColor: "#ddd", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                        <img src="/Frame7.svg" alt="close" style={{ width: "12px", height: "12px" }} />
                                        <div className="stroke-8_14" style={{ position: "absolute", inset: 0, border: "1px solid #000", borderTopColor: "#fff", borderLeftColor: "#fff" }}></div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* 메뉴 버튼 모음 */}
                        <div id="52_30" className="Pixso-frame-52_30" style={{ position: "relative", zIndex: 9000, overflow: "visible" }}>
                            <div className="frame-content-52_30">
                                <Regionmenu
                                    id="52_20" className="Pixso-instance-52_20 z-40" regionmenu={regionmenu_52_20}
                                    /* 🎯 그림자 + B0B0B0 배경색 + 흰색 테두리 */
                                    slot_97_144={<div className="hover-target hover-shadow-color" onClick={(e) => { e.stopPropagation(); setRegionmenu_52_20("True"); }}><Button1components className="Pixso-instance-2_188" button1state="default" slot_45_10={<p id="2_189" className="Pixso-paragraph-2_189" style={{pointerEvents:"none", margin: 0}}>{"REGION"}</p>} /></div>}
                                    slot_97_159={<div className="hover-target hover-shadow-color" onClick={(e) => { e.stopPropagation(); setRegionmenu_52_20("False"); }}><Button1components className="Pixso-instance-2_188" button1state="default" slot_45_10={<p id="2_189_exp" className="Pixso-paragraph-2_189" style={{pointerEvents:"none", margin: 0}}>{"REGION"}</p>} /></div>}
                                    
                                    /* 드롭다운 하위 메뉴는 배경색만 처리 */
slot_97_161={
    <div className="hover-target hover-color" onClick={(e) => { 
        e.stopPropagation(); 
        setSelectedRegion("KR");            /* 🎯 국가를 한국으로 변경 */
        setRegionmenu_52_20("False");       /* 🎯 클릭 시 드롭다운 자동으로 닫기 */
    }}>
        <Button2components className="Pixso-instance-97_161" button2state="default" slot_77_120={<p id="77_120_kr" className="Pixso-paragraph-77_120" style={{pointerEvents:"none", margin: 0}}>{"KOREA"}</p>} />
    </div>
}
slot_97_162={
    <div className="hover-target hover-color" onClick={(e) => { 
        e.stopPropagation(); 
        setSelectedRegion("JP");            /* 🎯 국가를 일본으로 변경 */
        setRegionmenu_52_20("False");       /* 🎯 클릭 시 드롭다운 자동으로 닫기 */
    }}>
        <Button2components className="Pixso-instance-97_162" button2state="default" slot_77_120={<p id="77_120_jp" className="Pixso-paragraph-77_120" style={{pointerEvents:"none", margin: 0}}>{"JAPAN"}</p>} />
    </div>
}
slot_97_163={
    <div className="hover-target hover-color" onClick={(e) => { 
        e.stopPropagation(); 
        setSelectedRegion("US");            /* 🎯 국가를 미국으로 변경 */
        setRegionmenu_52_20("False");       /* 🎯 클릭 시 드롭다운 자동으로 닫기 */
    }}>
        <Button2components className="Pixso-instance-97_163" button2state="default" slot_77_120={<p id="77_120_us" className="Pixso-paragraph-77_120" style={{pointerEvents:"none", margin: 0}}>{"AMERICA"}</p>} />
    </div>
}
                                />
                                <Editmenu
                                    id="52_23" className="Pixso-instance-52_23 z-30" editmenu="False"
                                    /* 🎯 그림자 + B0B0B0 배경색 + 흰색 테두리 */
                                    slot_107_320={
                                        <div className="hover-target hover-shadow-color" onClick={() => openAddModal(getLocalDateStr(new Date()))}>
                                            <Button1components className="Pixso-instance-2_170" button1state="default" slot_45_10={<p id="2_171" className="Pixso-paragraph-2_171" style={{pointerEvents:"none", margin: 0}}>{"EDIT"}</p>} />
                                        </div>
                                    }
                                />
                                <Searchmenu 
                                    id="52_26" className="Pixso-instance-52_26 z-20" searchmenu="False" 
                                    /* 🎯 그림자 + B0B0B0 배경색 + 흰색 테두리 */
                                    slot_107_367={<div className="hover-target hover-shadow-color" onClick={() => setIsSearchModalOpen(true)}><Button1components className="Pixso-instance-2_176" button1state="default" slot_45_10={<p id="2_177" className="Pixso-paragraph-2_177" style={{pointerEvents:"none", margin: 0}}>{"SEARCH"}</p>} /></div>} 
                                />
                                <Resetbutton 
                                    id="52_28" className="Pixso-instance-52_28 z-10" resetmenu="default" 
                                    /* 🎯 그림자 + B0B0B0 배경색 + 흰색 테두리 */
                                    slot_143_265={<div className="hover-target hover-shadow-color" onClick={() => { 
                                        const now = new Date();
                                        setRightDate(new Date(now.getFullYear(), now.getMonth() + 1, 1)); 
                                        setSelectedRegion("KR"); 
                                        setSearchQuery(""); 
                                    }}><Button1components className="Pixso-instance-2_186" button1state="default" slot_45_10={<p id="2_187" className="Pixso-paragraph-2_187" style={{pointerEvents:"none", margin: 0}}>{"RESET"}</p>} /></div>} 
                                />
                            </div>
                        </div>

                        {/* 메인 달력 프레임 */}
                        <div id="68_326" className="stroke-wrapper-68_326">
                            <div className="Pixso-frame-68_326">
                                <div className="shadow-blend-unknown-0"></div>
                                <div className="frame-content-68_326">
                                    <div id="66_206" className="Pixso-frame-66_206">
                                        <div className="frame-content-66_206">
                                            <div id="66_205" className="Pixso-frame-66_205">
                                                <div className="frame-content-66_205">
                                                    <div id="66_201" className="Pixso-frame-66_201"><div className="frame-content-66_201"><p id="66_198" className="Pixso-paragraph-66_198" style={{fontFamily:"Retro Gaming, monospace", margin: 0}}>{leftDate.getFullYear()}</p></div></div>
                                                    <div id="66_202" className="Pixso-frame-66_202"><div className="frame-content-66_202"><p id="66_203" className="Pixso-paragraph-66_203" style={{fontFamily:"Retro Gaming, monospace", margin: 0}}>{String(leftDate.getMonth() + 1).padStart(2, '0')}</p></div></div>
                                                </div>
                                            </div>
                                            <div id="64_170" className="Pixso-frame-64_170">
                                                <div className="frame-content-64_170">
                                                    <div id="64_78" className="Pixso-frame-64_78">
                                                        <div className="frame-content-64_78">
                                                            {DayHeader({ cId: "64_46", pId: "2_15", text: "S" })}
                                                            {DayHeader({ cId: "64_63", pId: "2_32", text: "M" })}
                                                            {DayHeader({ cId: "64_66", pId: "2_43", text: "T" })}
                                                            {DayHeader({ cId: "64_69", pId: "2_7", text: "W" })}
                                                            {DayHeader({ cId: "64_175", pId: "2_48", text: "T" })}
                                                            {DayHeader({ cId: "64_181", pId: "2_25", text: "F" })}
                                                            {DayHeader({ cId: "64_178", pId: "2_42", text: "S" })}
                                                        </div>
                                                    </div>
                                                    {rowIdsL.map((id, w) => (
                                                        <div key={id} id={id} className={`Pixso-frame-${id}`}>
                                                            <div className={`frame-content-${id}`}>{leftGrid.slice(w*7, w*7+7).map((item, idx) => renderCell(item, `L-${w}-${idx}`))}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div id="68_322" className="Pixso-vector-68_322"></div>

                                    <div id="68_321" className="Pixso-frame-68_321">
                                        <div className="frame-content-68_321">
                                            <div id="66_320" className="Pixso-frame-66_320">
                                                <div className="frame-content-66_320">
                                                    {/* 🎯 이전 달로 이동 버튼: 바깥 그림자 제거 클래스(hide-outer-shadow) 추가! */}
<div className="hover-target hover-shadow-color hide-outer-shadow" onClick={() => setRightDate(new Date(rightDate.getFullYear(), rightDate.getMonth() - 1, 1))}>
    <Button1components className="Pixso-instance-58_13" button1state="default" slot_45_10={<p id="2_44" className="Pixso-paragraph-2_44" style={{pointerEvents:"none", margin: 0}}>{"<"}</p>} />
</div>
                                                    <div id="66_208" className="Pixso-frame-66_208">
                                                        <div className="frame-content-66_208">
                                                            <div id="66_209" className="Pixso-frame-66_209"><div className="frame-content-66_209"><p id="66_210" className="Pixso-paragraph-66_210" style={{fontFamily:"Retro Gaming, monospace", margin: 0}}>{rightDate.getFullYear()}</p></div></div>
                                                            <div id="66_211" className="Pixso-frame-66_211"><div className="frame-content-66_211"><p id="66_212" className="Pixso-paragraph-66_212" style={{fontFamily:"Retro Gaming, monospace", margin: 0}}>{String(rightDate.getMonth() + 1).padStart(2, '0')}</p></div></div>
                                                        </div>
                                                    </div>
                                                    {/* 🎯 다음 달로 이동 버튼: 바깥 그림자 제거 클래스(hide-outer-shadow) 추가! */}
<div className="hover-target hover-shadow-color hide-outer-shadow" onClick={() => setRightDate(new Date(rightDate.getFullYear(), rightDate.getMonth() + 1, 1))}>
    <Button1components className="Pixso-instance-129_172" button1state="default" slot_45_10={<p id="2_40" className="Pixso-paragraph-2_40" style={{pointerEvents:"none", margin: 0}}>{">"}</p>} />
</div>
                                                </div>
                                            </div>
                                            <div id="66_213" className="Pixso-frame-66_213">
                                                <div className="frame-content-66_213">
                                                    <div id="66_214" className="Pixso-frame-66_214">
                                                        <div className="frame-content-66_214">
                                                            {DayHeader({ cId: "66_215", pId: "2_1", text: "S" })}
                                                            {DayHeader({ cId: "66_216", pId: "2_24", text: "M" })}
                                                            {DayHeader({ cId: "66_217", pId: "2_3", text: "T" })}
                                                            {DayHeader({ cId: "66_218", pId: "2_11", text: "W" })}
                                                            {DayHeader({ cId: "66_219", pId: "2_13", text: "T" })}
                                                            {DayHeader({ cId: "66_220", pId: "2_27", text: "F" })}
                                                            {DayHeader({ cId: "66_221", pId: "2_39", text: "S" })}
                                                        </div>
                                                    </div>
                                                    {rowIdsR.map((id, w) => (
                                                        <div key={id} id={id} className={`Pixso-frame-${id}`}>
                                                            <div className={`frame-content-${id}`}>{rightGrid.slice(w*7, w*7+7).map((item, idx) => renderCell(item, `R-${w}-${idx}`))}</div>
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

            {/* 모달 1: 일정 추가 모달창 */}
            {isAddModalOpen && (
                <div 
                    style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center" }}
                    onClick={() => setIsAddModalOpen(false)} 
                >
                    <div style={{ width: "250px" }} onClick={(e) => e.stopPropagation()}>
                        <div id="107_433" className="stroke-wrapper-107_433">
                            <div className="Pixso-frame-107_433">
                                <div className="frame-content-107_433">
                                    <div id="107_432" className="Pixso-frame-107_432">
                                        <div className="frame-content-107_432">
                                            <div id="107_417" className="Pixso-frame-107_417">
                                                <div className="frame-content-107_417">
                                                    <p id="107_416" className="Pixso-paragraph-107_416" style={{margin: 0}}>{"Title"}</p>
                                                </div>
                                            </div>
                                            {/* 🎯 일정 추가 팝업의 OK 버튼: 어두운 회색(#4B4B4B) + 글자 흰색 변경 */}
                                            <div className="hover-target hover-dark" onClick={handleSaveEvent} style={{ width: "auto" }}>
                                                <Button1components className="Pixso-instance-107_429" button1state="default" slot_45_10={<p id="13_6" className="Pixso-paragraph-13_6" style={{pointerEvents:"none", margin: 0}}>{"OK"}</p>} />
                                            </div>
                                        </div>
                                    </div>
                                    <div id="139_134" className="Pixso-frame-139_134">
                                        <div id="107_410" className="stroke-wrapper-107_410">
                                            <div className="Pixso-rectangle-107_410" style={{ position: "relative" }}>
                                                <div className="shadow-blend-unknown-0"></div>
                                                <input autoFocus type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent", border: "none", outline: "none", padding: "0 8px", fontFamily: "inherit" }} />
                                            </div>
                                            <div className="stroke-107_410"></div>
                                        </div>
                                    </div>
                                    <div id="107_418" className="Pixso-frame-107_418">
                                        <div className="frame-content-107_418"><p id="107_419" className="Pixso-paragraph-107_419" style={{margin: 0}}>{"Date"}</p></div>
                                    </div>
                                    <div id="125_157" className="Pixso-frame-125_157">
                                        <div className="frame-content-125_157">
                                            <div id="125_161" className="stroke-wrapper-125_161">
                                                <div className="Pixso-frame-125_161" style={{ position: "relative", padding: 0 }}>
                                                    <div className="shadow-blend-unknown-0"></div>
                                                    <input type="text" value={eventStartDate} onChange={(e) => setEventStartDate(e.target.value)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent", border: "none", outline: "none", textAlign: "center", fontFamily: "inherit", fontSize: "12px" }} />
                                                </div>
                                                <div className="stroke-125_161"></div>
                                            </div>
                                            <div id="125_155" className="Pixso-frame-125_155">
                                                <div className="frame-content-125_155"><p id="125_154" className="Pixso-paragraph-125_154" style={{margin: 0}}>{"-"}</p></div>
                                            </div>
                                            <div id="125_162" className="stroke-wrapper-125_162">
                                                <div className="Pixso-frame-125_162" style={{ position: "relative", padding: 0 }}>
                                                    <div className="shadow-blend-unknown-0"></div>
                                                    <input type="text" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent", border: "none", outline: "none", textAlign: "center", fontFamily: "inherit", fontSize: "12px" }} />
                                                </div>
                                                <div className="stroke-125_162"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div id="107_423" className="Pixso-frame-107_423">
                                        <div className="frame-content-107_423"><p id="107_421" className="Pixso-paragraph-107_421" style={{margin: 0}}>{"Memo"}</p></div>
                                    </div>
                                    <div id="139_135" className="Pixso-frame-139_135">
                                        <div id="107_413" className="stroke-wrapper-107_413">
                                            <div className="Pixso-rectangle-107_413" style={{ position: "relative" }}>
                                                <div className="shadow-blend-unknown-0"></div>
                                                <textarea value={eventMemo} onChange={(e) => setEventMemo(e.target.value)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent", border: "none", outline: "none", padding: "8px", fontFamily: "inherit", resize: "none" }} />
                                            </div>
                                            <div className="stroke-107_413"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="stroke-107_433"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* 모달 2: 일정 확인/삭제 모달창 */}
            {viewModalData.isOpen && (
                <div 
                    style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center" }}
                    onClick={() => setViewModalData({ isOpen: false, title: "", isHoliday: false })} 
                >
                    <div style={{ width: "250px" }} onClick={(e) => e.stopPropagation()}>
                        <div id="120_147" className="stroke-wrapper-120_147">
                            <div className="Pixso-frame-120_147" style={{ padding: "12px", justifyContent: "space-between" }}>
                                <div className="frame-content-120_147">
                                    <div id="119_132" className="Pixso-frame-119_132">
                                        <div className="frame-content-119_132">
                                            <div id="139_127" className="Pixso-frame-139_127">
                                                <div className="frame-content-139_127">
                                                    <p id="139_128" className="Pixso-paragraph-139_128" style={{margin: 0}}>{"SCHEDULE"}</p>
                                                </div>
                                            </div>
                                            {/* 🎯 스케줄 안내 팝업의 닫기 [X] 버튼: 그림자 + B0B0B0 배경색 + 흰색 테두리 */}
                                            <div className="hover-target hover-shadow-color" onClick={() => setViewModalData({ isOpen: false, title: "", isHoliday: false })}>
                                                <Button3components id="135_159" className="Pixso-instance-135_159" button3state="default" />
                                            </div>
                                        </div>
                                    </div>
                                    <div id="120_138" className="Pixso-frame-120_138">
                                        <div className="frame-content-120_138">
                                            <div id="119_136" className="Pixso-frame-119_136">
                                                <div className="frame-content-119_136">
                                                    <p id="119_133" className="Pixso-paragraph-119_133" style={{margin: 0}}>{viewModalData.title}</p>
                                                </div>
                                            </div>
                                            <div id="120_137" className="Pixso-frame-120_137">
                                                <div className="frame-content-120_137">
                                                    <p id="119_134" className="Pixso-paragraph-119_134" style={{margin: 0}}>{viewModalData.isHoliday ? "공휴일" : "내 일정"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ 
                                        visibility: viewModalData.isHoliday ? "hidden" : "visible", 
                                        pointerEvents: viewModalData.isHoliday ? "none" : "auto" 
                                    }}>
                                        {/* 🎯 DELETE 버튼: 브라우저 팝업 대신 커스텀 모달창 띄우기로 변경! */}
<div className="hover-target hover-shadow-color" onClick={() => { if (!viewModalData.isHoliday && viewModalData.eventId) setDeleteConfirmId(viewModalData.eventId); }}>
    <Button1components id="120_141" className="Pixso-instance-120_141" button1state="default" slot_45_10={<p id="14_14" className="Pixso-paragraph-14_14" style={{pointerEvents:"none", margin: 0}}>{"DELETE"}</p>} />
</div>
                                    </div>

                                </div>
                            </div>
                            <div className="stroke-120_147"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* 모달 3: SEARCH 검색 모달창 */}
            {isSearchModalOpen && (
                <div 
                    style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center" }}
                    onClick={() => setIsSearchModalOpen(false)} 
                >
                    <div style={{ width: "280px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="stroke-wrapper-120_147" style={{ height: "auto", minHeight: "200px" }}>
                            <div className="Pixso-frame-120_147" style={{ justifyContent: "flex-start", height: "auto" }}>
                                <div className="frame-content-120_147" style={{ alignItems: "stretch", padding: "5px" }}>
                                    
                                    <div id="119_132" className="Pixso-frame-119_132" style={{ width: "100%" }}>
                                        <div className="frame-content-119_132" style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
                                            <div id="139_127" className="Pixso-frame-139_127">
                                                <div className="frame-content-139_127" style={{ display: "flex", justifyContent: "flex-start", padding: 0 }}>
                                                    <p id="139_128" className="Pixso-paragraph-139_128" style={{ margin: 0, textAlign: "left", width: "auto" }}>{"SEARCH"}</p>
                                                </div>
                                            </div>
                                            {/* 🎯 검색 모달창의 닫기 [X] 버튼: 그림자 + B0B0B0 배경색 + 흰색 테두리 */}
                                            <div className="hover-target hover-shadow-color" onClick={() => setIsSearchModalOpen(false)}>
                                                <Button3components id="135_159" className="Pixso-instance-135_159" button3state="default" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ marginTop: "5px", border: "2px solid", borderTopColor: "#888", borderLeftColor: "#888", borderBottomColor: "#fff", borderRightColor: "#fff", backgroundColor: "#fff" }}>
                                        <input 
                                            autoFocus type="text" placeholder="KEYWORD..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                                            style={{ width: "100%", padding: "6px", border: "none", outline: "none", fontFamily: "Retro Gaming, DungGeunMo, monospace", fontSize: "12px", boxSizing: "border-box" }} 
                                        />
                                    </div>

                                    <div style={{ marginTop: "5px", minHeight: "100px", maxHeight: "150px", overflowY: "auto", backgroundColor: "#fff", border: "2px solid", borderTopColor: "#888", borderLeftColor: "#888", borderBottomColor: "#fff", borderRightColor: "#fff", padding: "8px", fontFamily: "DungGeunMo, monospace", fontSize: "12px", boxSizing: "border-box" }}>
                                        {searchQuery.trim() === "" ? (
                                            <span style={{ color: "#888" }}>Waiting for input...</span>
                                        ) : searchResults.length === 0 ? (
                                            <span style={{ color: "red" }}>NO DATA FOUND.</span>
                                        ) : (
                                            searchResults.map((e, i) => (
                                                <div key={i} style={{ margin: "4px 0", borderBottom: "1px dashed #ccc", paddingBottom: "4px", cursor: "pointer" }}>
                                                    <span style={{ color: "blue", marginRight: "6px" }}>[{e.start?.date || e.start?.dateTime?.split("T")[0]}]</span>
                                                    {e.summary}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                </div>
                            </div>
                            <div className="stroke-120_147"></div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* 👇👇👇 여기에 모달 4 (커스텀 삭제 확인 모달)를 붙여넣습니다! 👇👇👇 */}
            {deleteConfirmId && (
                <div 
                    style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 999999, display: "flex", justifyContent: "center", alignItems: "center" }}
                >
                    <div className="stroke-wrapper-120_147" style={{ width: "220px", height: "auto", padding: "15px", backgroundColor: "#ddd", display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ border: "2px solid", borderTopColor: "#888", borderLeftColor: "#888", borderBottomColor: "#fff", borderRightColor: "#fff", padding: "10px", backgroundColor: "#fff", textAlign: "center" }}>
                            <p style={{ fontFamily: "Retro Gaming, DungGeunMo, monospace", fontSize: "14px", margin: 0 }}>DELETE SCHEDULE?</p>
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                            {/* YES 버튼 */}
                            <div className="hover-target hover-dark" onClick={executeDelete} style={{ width: "80px" }}>
                                <Button1components button1state="default" slot_45_10={<p style={{pointerEvents:"none", margin: 0, fontSize: "12px"}}>YES</p>} />
                            </div>
                            {/* NO 버튼 */}
                            <div className="hover-target hover-dark" onClick={() => setDeleteConfirmId(null)} style={{ width: "80px" }}>
                                <Button1components button1state="default" slot_45_10={<p style={{pointerEvents:"none", margin: 0, fontSize: "12px"}}>NO</p>} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* 👆👆👆 여기까지 붙여넣으시면 됩니다 👆👆👆 */}
            
        </div>
    );
};
export default Frame72327;
