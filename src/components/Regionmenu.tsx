import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "@/styles/Regionmenu.css";

interface RegionmenuProps {
    id?: string;
    className?: string;
    regionmenu?: string;
    slot_97_144?: React.ReactNode; // False(닫힘) 상태일 때의 REGION 버튼
    slot_97_159?: React.ReactNode; // True(열림) 상태일 때의 REGION 버튼 (유령 버튼화 방지용)
    slot_97_161?: React.ReactNode; // KOREA 버튼
    slot_97_162?: React.ReactNode; // JAPAN 버튼
    slot_97_163?: React.ReactNode; // AMERICA 버튼
}

const Regionmenu = ({
    regionmenu = "False",
    slot_97_144,
    slot_97_159,
    slot_97_161,
    slot_97_162,
    slot_97_163,
}: RegionmenuProps) => {
    return (
        /* 껍데기는 relative로 고정하여 하위 드롭다운의 기준점이 되게 합니다 */
        <div style={{ position: "relative", display: "inline-block", width: "78px", height: "25px" }}>
            
            <AnimatePresence mode="wait">
                {regionmenu === "False" ? (
                    <motion.div
                        key="false"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0 }}
                        style={{ position: "absolute", top: 0, left: 0 }}
                    >
                        {/* 평소 상태의 REGION 버튼 */}
                        {slot_97_144}
                    </motion.div>
                ) : (
                    <motion.div
                        key="true"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0 }}
                        style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
                    >
                        {/* 🎯 핵심 수정: True 상태일 때 버튼이 이중으로 겹치지 않도록, 
                            기본 REGION 버튼의 모습(slot_97_159)을 그대로 노출하되 
                            그 바로 아래 공간(top: 25px)에 드롭다운 메뉴 리스트 상자만 공중에 띄웁니다! */}
                        <div>
                            {slot_97_159}
                        </div>

                        {/* 윈도우 98 스타일 국가 선택 드롭다운 박스 알맹이 */}
                        <div style={{
                            position: "absolute",
                            top: "25px", /* 버튼 바로 밑 */
                            left: "0px",
                            width: "114px",
                            backgroundColor: "#dddddd",
                            border: "2px solid",
                            borderTopColor: "#ffffff",
                            borderLeftColor: "#ffffff",
                            borderBottomColor: "#000000",
                            borderRightColor: "#000000",
                            padding: "2px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                            zIndex: 99999 /* 달력을 덮도록 최상위 부여 */
                        }}>
                            {slot_97_161}
                            {slot_97_162}
                            {slot_97_163}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Regionmenu;
