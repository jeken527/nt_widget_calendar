import Regionmenu from "@/components/Regionmenu";
import { useState, useEffect, useRef } from "react";
import Button1components from "@/components/Button1components";
import Button2components from "@/components/Button2components"; // 드롭다운 하위 메뉴 부품 추가!
import Editmenu from "@/components/Editmenu";
import Searchmenu from "@/components/Searchmenu";
import Resetbutton from "@/components/Resetbutton";
import Datecomponents from "@/components/Datecomponents";
import Dateselectbutton1 from "@/components/Dateselectbutton1";
import Dateselectbutton2 from "@/components/Dateselectbutton2";
import "@/styles/Frame72327.css";

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

// 구글 캘린더 API 설정
const CLIENT_ID = "930243544712-7j81q7c4d7885v43u1nqlmgbdtf85oat.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

const HOLIDAY_CALENDARS: Record<string, string> = {
    KR: "ko.south_korea#holiday@group.v.calendar.google.com",
    JP: "ja.japanese#holiday@group.v.calendar.google.com",
    US: "en.usa#holiday@group.v.calendar.google.com"
};

const Frame72327 = () => {
    // ----------------------------------------------------
    // 1. 유저 원본 껍데기 상태 
    // ----------------------------------------------------
    const [regionmenu_52_20, setRegionmenu_52_20] = useState("False");
    const [button1state_2_188, setButton1state_2_188] = useState("default");
    const [button1state_2_170, setButton1state_2_170] = useState("default");
    const [button1state_2_176, setButton1state_2_176] = useState("default");
    const [button1state_2_186, setButton1state_2_186] = useState("default");
    const [button1state_58_13, setButton1state_58_13] = useState("default");
    const [button1state_129_172, setButton1state_129_172] = useState("default");

    // ----------------------------------------------------
    // 2. 동적 달력 및 드롭다운 엔진 상태
    // ----------------------------------------------------
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedRegion, setSelectedRegion] = useState("KR");
    const [holidays, setHolidays] = useState<any[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const tokenClientRef = useRef<any>(null);

    // 구글 API 스크립트 로드
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

    // 실시간 휴일 데이터 패치
    useEffect(() => {
        if (isAuthenticated) fetchHolidays();
    }, [isAuthenticated, currentDate, selectedRegion]);

    const fetchHolidays = async () => {
        try {
            const timeMin = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
            const timeMax = new Date(currentDate.getFullYear(), currentDate.getMonth() + 4, 0).toISOString();
            const holidayResp = await window.gapi.client.calendar.events.list({
                calendarId: HOLIDAY_CALENDARS[selectedRegion], timeMin, timeMax, singleEvents: true,
            });
            setHolidays(holidayResp.result.items || []);
        } catch (error: any) {
            if (error.status === 401) setIsAuthenticated(false);
        }
    };

    const handleLogin = () => tokenClientRef.current?.requestAccessToken({ prompt: "consent" });

    // ----------------------------------------------------
    // 드롭다운 메뉴 작동 함수
    // ----------------------------------------------------
    const toggleRegionMenu = (e: any) => {
        e.stopPropagation();
        setRegionmenu_52_20(prev => prev === "False" ? "True" : "False");
    };

    const selectRegion = (region: string) => (e: any) => {
        e.stopPropagation();
        setSelectedRegion(region);
        setRegionmenu_52_20("False"); // 선택 후 메뉴 닫기
    };

    // 현재 선택된 국가를 텍스트로 보여주기 위한 헬퍼
    const getRegionText = () => {
        if (selectedRegion === "KR") return "KOREA";
        if (selectedRegion === "JP") return "JAPAN";
        return "AMERICA";
    };

    // ----------------------------------------------------
    // 달력 날짜 자동 계산 로직
    // ----------------------------------------------------
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
        const dateStr = targetDate.toISOString().split("T")[0];
        if (dateStr === new Date().toISOString().split("T")[0]) return "today";
        if (holidays.some(h => (h.start?.date || h.start?.dateTime?.split("T")[0]) === dateStr)) return "holiday";
        return "default";
    };

    const pStyle = { fontFamily: "Retro Gaming, DungGeunMo, monospace", fontSize: "15px", color: "inherit", margin: 0 };
    
    const renderCell = (item: any, idx: number) => {
        const day = String(item.date.getDate());
        if (!item.isCurrentMonth) {
            return <Datecomponents key={idx} datestates="disable" slot_62_37={<p style={pStyle}>{day}</p>} />;
        }
        
        const state = getDateState(item.date, true);
        if (state === "holiday") {
            return (
                <Dateselectbutton2 key={idx} dateselectnew2="holiday" slot_146_537={
                    <Datecomponents datestates="holiday" slot_62_28={<p style={pStyle}>{day}</p>} />
                } />
            );
        }
        if (state === "today") {
            return (
                <Dateselectbutton1 key={idx} dateselectbutton="today" slot_146_414={
                    <Datecomponents datestates="today" slot_62_31={<p style={pStyle}>{day}</p>} />
                } />
            );
        }
        return (
            <Dateselectbutton1 key={idx} dateselectbutton="default" slot_146_413={
                <Datecomponents datestates="default" slot_60_22={<p style={pStyle}>{day}</p>} />
            } />
        );
    };

    const leftDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const rightDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 1);
    const leftGrid = getGridDates(leftDate.getFullYear(), leftDate.getMonth());
    const rightGrid = getGridDates(rightDate.getFullYear(), rightDate.getMonth());

    return (
        <div className="scroll-container">
            <div id="72_327" className="stroke-wrapper-72_327">
                <div className="Pixso-frame-72_327">
                    <div className="frame-content-72_327">
                        
                        {/* 최상단 장식 바 (로그인 버튼으로 활용) */}
                        <div id="45_8" className="Pixso-frame-45_8" onClick={handleLogin} style={{ cursor: "pointer" }}>
                            <div className="frame-content-45_8">
                                <div id="129_166" className="Pixso-frame-129_166">
                                    <p id="45_7" className="Pixso-paragraph-45_7" style={{ fontFamily: "Retro Gaming, monospace" }}>
                                        {isAuthenticated ? "CALENDAR CONNECTED" : "CLICK TO LOGIN"}
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
                                        <div id="8_14" className="stroke-wrapper-8_14">
                                            <div className="Pixso-frame-8_14">
                                                <div className="frame-content-8_14">
                                                    <div id="45_5" className="Pixso-vector-45_5"></div>
                                                </div>
                                            </div>
                                            <div className="stroke-8_14"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 메뉴 툴바 */}
                        <div id="52_30" className="Pixso-frame-52_30">
                            <div className="frame-content-52_30">
                                
                                {/* 🎯 완벽하게 복원된 드롭다운 영역 🎯 */}
                                <Regionmenu
                                    id="52_20" className="Pixso-instance-52_20" 
                                    regionmenu={regionmenu_52_20}
                                    click={toggleRegionMenu}
                                    
                                    // 1. 메뉴가 닫혀있을 때 보이는 버튼
                                    slot_97_144={
                                        <Button1components
                                            id="2_188" className="Pixso-instance-2_188" button1state={button1state_2_188}
                                            slot_45_10={<p id="2_189" className="Pixso-paragraph-2_189" style={{cursor:"pointer", pointerEvents:"auto"}}>{getRegionText()}</p>}
                                        />
                                    }
                                    // 2. 메뉴가 열려있을 때 상단에 켜져 있는(Checked) 버튼
                                    slot_97_159={
                                        <Button1components
                                            id="2_188_exp" className="Pixso-instance-2_188" button1state="checked"
                                            slot_45_10={<p id="2_189_exp" className="Pixso-paragraph-2_189" style={{cursor:"pointer", pointerEvents:"auto"}}>{getRegionText()}</p>}
                                        />
                                    }
                                    // 3. 하위 메뉴 항목: KOREA
                                    slot_97_161={
                                        <Button2components button2state="default" click={selectRegion("KR")} slot_77_120={<p id="77_120_kr" className="Pixso-paragraph-77_120" style={{cursor:"pointer", pointerEvents:"auto"}}>{"KOREA"}</p>} />
                                    }
                                    // 4. 하위 메뉴 항목: JAPAN
                                    slot_97_162={
                                        <Button2components button2state="default" click={selectRegion("JP")} slot_77_120={<p id="77_120_jp" className="Pixso-paragraph-77_120" style={{cursor:"pointer", pointerEvents:"auto"}}>{"JAPAN"}</p>} />
                                    }
                                    // 5. 하위 메뉴 항목: AMERICA
                                    slot_97_163={
                                        <Button2components button2state="default" click={selectRegion("US")} slot_77_120={<p id="77_120_us" className="Pixso-paragraph-77_120" style={{cursor:"pointer", pointerEvents:"auto"}}>{"AMERICA"}</p>} />
                                    }
                                />

                                <Editmenu
                                    id="52_23" className="Pixso-instance-52_23" editmenu="False"
                                    slot_107_320={
                                        <Button1components
                                            id="2_170" className="Pixso-instance-2_170" button1state={button1state_2_170}
                                            slot_45_10={<p id="2_171" className="Pixso-paragraph-2_171">{"EDIT"}</p>}
                                        />
                                    }
                                />
                                <Searchmenu
                                    id="52_26" className="Pixso-instance-52_26" searchmenu="False"
                                    slot_107_367={
                                        <Button1components
                                            id="2_176" className="Pixso-instance-2_176" button1state={button1state_2_176}
                                            slot_45_10={<p id="2_177" className="Pixso-paragraph-2_177">{"SEARCH"}</p>}
                                        />
                                    }
                                />
                                <Resetbutton
                                    id="52_28" className="Pixso-instance-52_28" resetmenu="default"
                                    slot_143_265={
                                        <Button1components
                                            id="2_186" className="Pixso-instance-2_186" button1state={button1state_2_186}
                                            slot_45_10={<p id="2_187" className="Pixso-paragraph-2_187" onClick={() => { setCurrentDate(new Date()); setSelectedRegion("KR"); }} style={{cursor:"pointer", pointerEvents:"auto"}}>{"RESET"}</p>}
                                        />
                                    }
                                />
                            </div>
                        </div>

                        {/* 메인 달력 프레임 */}
                        <div id="68_326" className="stroke-wrapper-68_326">
                            <div className="Pixso-frame-68_326">
                                <div className="shadow-blend-unknown-0"></div>
                                <div className="frame-content-68_326">
                                    
                                    {/* 1. 왼쪽 캘린더 */}
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
                                                        <div className="frame-content-64_78">
                                                            <Datecomponents id="64_46" className="Pixso-instance-64_46" datestates="day" slot_62_34={<p id="2_15" className="Pixso-paragraph-2_15">{"S"}</p>} />
                                                            <Datecomponents id="64_63" className="Pixso-instance-64_63" datestates="day" slot_62_34={<p id="2_32" className="Pixso-paragraph-2_32">{"M"}</p>} />
                                                            <Datecomponents id="64_66" className="Pixso-instance-64_66" datestates="day" slot_62_34={<p id="2_43" className="Pixso-paragraph-2_43">{"T"}</p>} />
                                                            <Datecomponents id="64_69" className="Pixso-instance-64_69" datestates="day" slot_62_34={<p id="2_7" className="Pixso-paragraph-2_7">{"W"}</p>} />
                                                            <Datecomponents id="64_175" className="Pixso-instance-64_175" datestates="day" slot_62_34={<p id="2_48" className="Pixso-paragraph-2_48">{"T"}</p>} />
                                                            <Datecomponents id="64_181" className="Pixso-instance-64_181" datestates="day" slot_62_34={<p id="2_25" className="Pixso-paragraph-2_25">{"F"}</p>} />
                                                            <Datecomponents id="64_178" className="Pixso-instance-64_178" datestates="day" slot_62_34={<p id="2_42" className="Pixso-paragraph-2_42">{"S"}</p>} />
                                                        </div>
                                                    </div>
                                                    {/* 자동 매핑되는 왼쪽 날짜들 */}
                                                    <div id="64_79" className="Pixso-frame-64_79"><div className="frame-content-64_79">{leftGrid.slice(0, 7).map((item, idx) => renderCell(item, idx))}</div></div>
                                                    <div id="64_95" className="Pixso-frame-64_95"><div className="frame-content-64_95">{leftGrid.slice(7, 14).map((item, idx) => renderCell(item, idx))}</div></div>
                                                    <div id="64_110" className="Pixso-frame-64_110"><div className="frame-content-64_110">{leftGrid.slice(14, 21).map((item, idx) => renderCell(item, idx))}</div></div>
                                                    <div id="64_125" className="Pixso-frame-64_125"><div className="frame-content-64_125">{leftGrid.slice(21, 28).map((item, idx) => renderCell(item, idx))}</div></div>
                                                    <div id="64_140" className="Pixso-frame-64_140"><div className="frame-content-64_140">{leftGrid.slice(28, 35).map((item, idx) => renderCell(item, idx))}</div></div>
                                                    <div id="64_155" className="Pixso-frame-64_155"><div className="frame-content-64_155">{leftGrid.slice(35, 42).map((item, idx) => renderCell(item, idx))}</div></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div id="68_322" className="Pixso-vector-68_322"></div>

                                    {/* 2. 오른쪽 캘린더 */}
                                    <div id="68_321" className="Pixso-frame-68_321">
                                        <div className="frame-content-68_321">
                                            <div id="66_320" className="Pixso-frame-66_320">
                                                <div className="frame-content-66_320">
                                                    <Button1components
                                                        id="58_13" className="Pixso-instance-58_13" button1state={button1state_58_13}
                                                        slot_45_10={<p id="2_44" className="Pixso-paragraph-2_44" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} style={{cursor:"pointer", pointerEvents:"auto"}}>{"<"}</p>}
                                                    />
                                                    <div id="66_208" className="Pixso-frame-66_208">
                                                        <div className="frame-content-66_208">
                                                            <div id="66_209" className="Pixso-frame-66_209"><div className="frame-content-66_209"><p id="66_210" className="Pixso-paragraph-66_210" style={{fontFamily:"Retro Gaming, monospace"}}>{rightDate.getFullYear()}</p></div></div>
                                                            <div id="66_211" className="Pixso-frame-66_211"><div className="frame-content-66_211"><p id="66_212" className="Pixso-paragraph-66_212" style={{fontFamily:"Retro Gaming, monospace"}}>{String(rightDate.getMonth() + 1).padStart(2, '0')}</p></div></div>
                                                        </div>
                                                    </div>
                                                    <Button1components
                                                        id="129_172" className="Pixso-instance-129_172" button1state={button1state_129_172}
                                                        slot_45_10={<p id="2_40" className="Pixso-paragraph-2_40" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} style={{cursor:"pointer", pointerEvents:"auto"}}>{">"}</p>}
                                                    />
                                                </div>
                                            </div>
                                            <div id="66_213" className="Pixso-frame-66_213">
                                                <div className="frame-content-66_213">
                                                    <div id="66_214" className="Pixso-frame-66_214">
                                                        <div className="frame-content-66_214">
                                                            <Datecomponents id="66_215" className="Pixso-instance-66_215" datestates="day" slot_62_34={<p id="2_1" className="Pixso-paragraph-2_1">{"S"}</p>} />
                                                            <Datecomponents id="66_216" className="Pixso-instance-66_216" datestates="day" slot_62_34={<p id="2_24" className="Pixso-paragraph-2_24">{"M"}</p>} />
                                                            <Datecomponents id="66_217" className="Pixso-instance-66_217" datestates="day" slot_62_34={<p id="2_3" className="Pixso-paragraph-2_3">{"T"}</p>} />
                                                            <Datecomponents id="66_218" className="Pixso-instance-66_218" datestates="day" slot_62_34={<p id="2_11" className="Pixso-paragraph-2_11">{"W"}</p>} />
                                                            <Datecomponents id="66_219" className="Pixso-instance-66_219" datestates="day" slot_62_34={<p id="2_13" className="Pixso-paragraph-2_13">{"T"}</p>} />
                                                            <Datecomponents id="66_220" className="Pixso-instance-66_220" datestates="day" slot_62_34={<p id="2_27" className="Pixso-paragraph-2_27">{"F"}</p>} />
                                                            <Datecomponents id="66_221" className="Pixso-instance-66_221" datestates="day" slot_62_34={<p id="2_39" className="Pixso-paragraph-2_39">{"S"}</p>} />
                                                        </div>
                                                    </div>
                                                    {/* 자동 매핑되는 오른쪽 날짜들 */}
                                                    <div id="66_222" className="Pixso-frame-66_222"><div className="frame-content-66_222">{rightGrid.slice(0, 7).map((item, idx) => renderCell(item, idx))}</div></div>
                                                    <div id="66_230" className="Pixso-frame-66_230"><div className="frame-content-66_230">{rightGrid.slice(7, 14).map((item, idx) => renderCell(item, idx))}</div></div>
                                                    <div id="66_238" className="Pixso-frame-66_238"><div className="frame-content-66_238">{rightGrid.slice(14, 21).map((item, idx) => renderCell(item, idx))}</div></div>
                                                    <div id="66_246" className="Pixso-frame-66_246"><div className="frame-content-66_246">{rightGrid.slice(21, 28).map((item, idx) => renderCell(item, idx))}</div></div>
                                                    <div id="66_254" className="Pixso-frame-66_254"><div className="frame-content-66_254">{rightGrid.slice(28, 35).map((item, idx) => renderCell(item, idx))}</div></div>
                                                    <div id="66_262" className="Pixso-frame-66_262"><div className="frame-content-66_262">{rightGrid.slice(35, 42).map((item, idx) => renderCell(item, idx))}</div></div>
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
        </div>
    );
};
export default Frame72327;
