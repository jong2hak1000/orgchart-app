import React, { useState, useEffect } from "react";
import { Tree } from 'react-organizational-chart';
import './App.css';

// 각 노드(사람/부서)를 시각적으로 표시할 컴포넌트
const OrgChartNode = ({ name, myCode }) => (
  <div style={{
    padding: '10px 15px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    textAlign: 'center',
    backgroundColor: '#e6f7ff',
    minWidth: '160px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
    margin: '5px'
  }}>
    {/* 이름과 코드를 분리하여 표시하고 스타일 조정 */}
    <div style={{ fontWeight: 'bold', fontSize: '1.1em', color: '#333' }}>{name}</div>
    <div style={{ fontWeight: 'bold', fontSize: '1.1em', color: '#333', marginTop: '3px' }}>{myCode}</div>
  </div>
);


const App = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ userId: "", name: "", phone: "", depositAmount: "", myCode: "", refCode: "", remarks: "", regDate: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [editingUserCode, setEditingUserCode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // 날짜를 YYYY-MM-DD 형식으로 포맷하는 헬퍼 함수
  const getFormattedDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const data = localStorage.getItem("orgUsers");
    if (data) setUsers(JSON.parse(data));
  }, []);

  useEffect(() => {
    localStorage.setItem("orgUsers", JSON.stringify(users));
  }, [users]);

  // 사용자 추가/수정 폼이 열릴 때마다 regDate를 오늘 날짜로 초기화
  // 단, 수정 모드일 때는 기존 데이터의 regDate를 사용
  useEffect(() => {
    if (!editingUserCode) {
        setForm(prevForm => ({ ...prevForm, regDate: getFormattedDate(new Date()) }));
    }
  }, [editingUserCode]);


  // 코드 및 아이디 유효성 검사 함수 (영어 대소문자, 숫자 허용)
  const isValidCode = (code) => {
    return /^[a-zA-Z0-9]*$/.test(code);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    // myCode, refCode, userId에 대한 유효성 검사 추가
    if ((name === "myCode" || name === "refCode" || name === "userId") && value !== "" && !isValidCode(value)) {
      alert("아이디, 내 코드, 추천인 코드에는 영어 대소문자와 숫자만 입력할 수 있습니다.");
      return;
    }
    if (name === "depositAmount") {
      if (value === "" || /^[0-9]*$/.test(value)) {
        setForm({ ...form, [name]: value });
      } else {
        alert("입금액에는 숫자만 입력할 수 있습니다.");
      }
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = () => {
    // userId 필수 입력 검사 추가
    if (!form.name || !form.myCode || !form.refCode || !form.userId) {
      alert("이름, 내 코드, 추천인 코드, 아이디는 필수 입력 항목입니다.");
      return;
    }

    const finalRegDate = form.regDate || getFormattedDate(new Date());

    if (editingUserCode) {
      if (form.myCode !== editingUserCode) {
        alert("수정 모드에서는 '내 코드'를 변경할 수 없습니다.");
        return;
      }
      // 수정 시 userId 중복 검사 (본인 제외)
      const isDuplicateUserId = users.some(u => u.userId === form.userId && u.myCode !== editingUserCode);
      if (isDuplicateUserId) {
        alert("입력한 아이디는 이미 사용 중입니다. 다른 아이디를 입력해 주세요.");
        return;
      }

      if (form.refCode && form.refCode !== "0000" && !users.some(u => u.myCode === form.refCode)) {
        alert("입력한 추천인 코드를 가진 사용자가 존재하지 않습니다. 정확한 코드를 입력하거나, 최상위 사용자로 등록하려면 추천인 코드를 '0000'으로 입력하세요.");
        return;
      }
      
      setUsers(prevUsers => prevUsers.map(user => 
        user.myCode === editingUserCode ? { ...form, regDate: finalRegDate } : user 
      ));
      alert("사용자 정보가 수정되었습니다.");
      setEditingUserCode(null);
    } else {
      const isDuplicateCode = users.some((u) => u.myCode === form.myCode);
      if (isDuplicateCode) {
        alert("'내 코드'는 중복될 수 없습니다. 다른 코드를 입력해 주세요.");
        return;
      }
      // 신규 등록 시 userId 중복 검사
      const isDuplicateUserId = users.some(u => u.userId === form.userId);
      if (isDuplicateUserId) {
        alert("입력한 아이디는 이미 사용 중입니다. 다른 아이디를 입력해 주세요.");
        return;
      }

      let finalRefCode = form.refCode;

      if (form.refCode) {
        if (form.refCode !== "0000" && !users.some(u => u.myCode === form.refCode)) {
          alert("입력한 추천인 코드를 가진 사용자가 존재하지 않습니다. 정확한 코드를 입력하거나, 최상위 사용자로 등록하려면 '0000'을 입력하세요.");
          return;
        }
        const sameRefCodeUsers = users.filter((u) => u.refCode === form.refCode);
        if (sameRefCodeUsers.length > 0) {
          const confirmRef = window.confirm(`이미 추천인 코드(${form.refCode})를 가진 사용자가 ${sameRefCodeUsers.length}명 존재합니다. 그래도 등록하시겠습니까?`);
          if (!confirmRef) return;
        }
      } else {
        alert("새로운 사용자를 등록하려면 추천인 코드를 입력해야 합니다. 최상위 사용자로 등록하려면 '0000'을 입력하세요.");
        return;
      }
      
      setUsers([...users, { ...form, refCode: finalRefCode, regDate: finalRegDate }]);
      alert("새 사용자가 등록되었습니다.");
    }
    
    setForm({ userId: "", name: "", phone: "", depositAmount: "", myCode: "", refCode: "", remarks: "", regDate: "" });
    setFilteredUsers([]);
    setSearchQuery("");
  };

  const deleteUser = (codeToDelete) => {
    if (!window.confirm("정말 삭제하시겠습니까? 해당 사용자와 모든 하위 사용자들도 삭제됩니다.")) return;
    
    const collectDescendants = (code) => {
      let descendants = [];
      const children = users.filter(u => u.refCode === code);
      for (const child of children) {
        descendants.push(child.myCode);
        descendants = descendants.concat(collectDescendants(child.myCode));
      }
      return descendants;
    };

    const usersToRemove = [codeToDelete, ...collectDescendants(codeToDelete)];
    setUsers(users.filter((u) => !usersToRemove.includes(u.myCode)));
    setFilteredUsers([]);
    setSearchQuery("");
  };

  const startEdit = (code) => {
    const userToEdit = users.find(u => u.myCode === code);
    if (userToEdit) {
      setForm({ ...userToEdit, regDate: userToEdit.regDate || getFormattedDate(new Date()) }); 
      setEditingUserCode(code);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 검색 함수 변경: 아이디, 이름, 코드로 검색 가능
  const searchUsers = () => {
    if (!searchQuery) {
      setFilteredUsers([]);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const foundUsers = users.filter(user => 
      user.userId.toLowerCase().includes(lowerCaseQuery) ||
      user.name.toLowerCase().includes(lowerCaseQuery) ||
      user.myCode.toLowerCase().includes(lowerCaseQuery)
    );

    if (foundUsers.length === 0) {
      alert("해당 검색어와 일치하는 사용자가 없습니다.");
      setFilteredUsers([]);
      return;
    }

    let rootUserForSearch = null;
    if (foundUsers.length > 0) {
        rootUserForSearch = foundUsers.find(u => u.myCode === searchQuery);
        if (!rootUserForSearch) {
            rootUserForSearch = foundUsers.find(u => 
                u.refCode === "0000" || 
                !filteredUsers.some(other => other.myCode === u.refCode)
            );
        }
    }

    if (rootUserForSearch) {
        const collectSubtree = (code, allUsers) => {
            let subtree = [];
            const user = allUsers.find(u => u.myCode === code);
            if (user) {
                subtree.push(user);
                const children = allUsers.filter(u => u.refCode === code);
                for (const child of children) {
                    subtree = subtree.concat(collectSubtree(child.myCode, allUsers));
                }
            }
            return subtree;
        };
        setFilteredUsers(collectSubtree(rootUserForSearch.myCode, users));
    } else {
        setFilteredUsers(foundUsers);
    }
  };


  const saveBackup = () => {
    const blob = new Blob([JSON.stringify(users)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "org_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data) && data.every(item => item.name && item.myCode)) {
          const updatedData = data.map(user => ({
              ...user,
              userId: user.userId || "",
              regDate: user.regDate || '날짜 없음'
          }));
          setUsers(updatedData);
          setFilteredUsers([]);
          alert("백업 데이터를 복원했습니다.");
        } else {
          alert("올바르지 않은 파일 형식 또는 데이터 구조입니다.");
        }
      } catch {
        alert("파일을 읽는 중 오류가 발생했습니다.");
      }
    };
    reader.readAsText(file);
  };
  
  const buildVisualTree = (data, parentCode = null) => {
    const children = data.filter(item => item.refCode === parentCode);
    
    return children.map(node => ({
      id: node.myCode,
      name: node.name,
      phone: node.phone,
      depositAmount: node.depositAmount,
      myCode: node.myCode,
      refCode: node.refCode,
      remarks: node.remarks,
      regDate: node.regDate,
      userId: node.userId,
      children: buildVisualTree(data, node.myCode)
    }));
  };

  const renderOrgChart = (node) => {
    if (!node) return null;

    return (
      <Tree
        key={node.id}
        lineCustom={<div style={{height: '20px', borderLeft: '1px solid #a0a0a0', margin: '0 auto'}}></div>}
        lineWidth={'1px'}
        lineColor={'#a0a0a0'}
        label={
          <div>
            <OrgChartNode
              name={node.name}
              myCode={node.myCode}
            />
            <button
              onClick={(e) => { e.stopPropagation(); deleteUser(node.myCode); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'red',
                cursor: 'pointer',
                fontSize: '0.8em',
                marginTop: '5px'
              }}
            >
              삭제
            </button>
          </div>
        }
      >
        {node.children && node.children.map(child => (
          renderOrgChart(child)
        ))}
      </Tree>
    );
  };

  const countAllDescendants = (userCode, allUsers) => {
      let count = 1;

      const directChildren = allUsers.filter(u => u.refCode === userCode);
      
      for (const child of directChildren) {
          count += countAllDescendants(child.myCode, allUsers);
      }

      return count;
  };

  const getLeftRightDescendantCounts = (userCode, allUsers) => {
      const directChildren = allUsers.filter(u => u.refCode === userCode);

      if (directChildren.length === 0) {
          return { left: 0, right: 0 };
      }

      const leftChild = directChildren[0];
      const leftCount = countAllDescendants(leftChild.myCode, allUsers) -1;

      let rightCount = 0;
      for (let i = 1; i < directChildren.length; i++) {
          rightCount += countAllDescendants(directChildren[i].myCode, allUsers) -1;
      }

      return { left: leftCount, right: rightCount };
  };

  const usersToDisplayInChart = filteredUsers.length > 0 ? filteredUsers : users;
  
  let chartRootNodes = [];
  if (filteredUsers.length > 0) {
      const potentialRoot = filteredUsers.find(u =>
          u.refCode === "0000" ||
          !filteredUsers.some(other => other.myCode === u.refCode)
      );
      if (potentialRoot) {
          chartRootNodes = [buildVisualTree(filteredUsers, potentialRoot.refCode).find(n => n.myCode === potentialRoot.myCode)];
      }
  } else {
      chartRootNodes = buildVisualTree(usersToDisplayInChart, "0000");
  }


  return (
    <div style={{ maxWidth: 800, margin: "30px auto", padding: 20, fontFamily: "Arial", border: '1px solid #eee', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ textAlign: 'center', color: '#0056b3' }}>XPLA 회원 관리</h2>

      <div style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>{editingUserCode ? "사용자 정보 수정" : "새 사용자 등록"}</h3>
        
        {/* 아이디 입력 필드: 자동 교정/맞춤법 검사 비활성화 및 텍스트 변환 방지 */}
        <input
          placeholder="아이디 (필수, 고유, 영어 대소문자/숫자만)"
          name="userId"
          value={form.userId}
          onChange={handleFormChange}
          disabled={!!editingUserCode}
          autoCorrect="off"
          spellCheck="false"
          style={{
            width: "calc(100% - 16px)",
            marginBottom: 10,
            padding: 8,
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: editingUserCode ? '#f0f0f0' : 'white',
            textTransform: 'none'
          }}
        />
        {/* 이름 입력 필드 */}
        <input
          placeholder="이름 (필수)"
          name="name"
          value={form.name}
          onChange={handleFormChange}
          style={{ width: "calc(100% - 16px)", marginBottom: 10, padding: 8, border: '1px solid #ccc', borderRadius: '4px' }}
        />
        
        <input
          placeholder="전화번호"
          name="phone"
          value={form.phone}
          onChange={handleFormChange}
          style={{ width: "calc(100% - 16px)", marginBottom: 10, padding: 8, border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          placeholder="입금액 (숫자만 입력)"
          name="depositAmount"
          value={form.depositAmount}
          onChange={handleFormChange}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          style={{ width: "calc(100% - 16px)", marginBottom: 10, padding: 8, border: '1px solid #ccc', borderRadius: '4px' }}
        />
        {/* 내 코드 입력 필드: 자동 교정/맞춤법 검사 비활성화 및 텍스트 변환 방지 */}
        <input
          placeholder="내 코드 (필수, 고유, 영어 대소문자/숫자만)"
          name="myCode"
          value={form.myCode}
          onChange={handleFormChange}
          disabled={!!editingUserCode}
          autoCorrect="off"
          spellCheck="false"
          style={{
            width: "calc(100% - 16px)",
            marginBottom: 10,
            padding: 8,
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: editingUserCode ? '#f0f0f0' : 'white',
            textTransform: 'none'
          }}
        />
        {/* 추천인 코드 입력 필드: 자동 교정/맞춤법 검사 비활성화 및 텍스트 변환 방지 */}
        <input
          placeholder="추천인 코드 (필수, 영어 대소문자/숫자만, 최상위는 '0000')"
          name="refCode"
          value={form.refCode}
          onChange={handleFormChange}
          autoCorrect="off"
          spellCheck="false"
          style={{
            width: "calc(100% - 16px)",
            marginBottom: 10,
            padding: 8,
            border: '1px solid #ccc',
            borderRadius: '4px',
            textTransform: 'none'
          }}
        />
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#555' }}>등록일:</label>
        <input
          type="date"
          name="regDate"
          value={form.regDate}
          onChange={handleFormChange}
          style={{ width: "calc(100% - 16px)", marginBottom: 10, padding: 8, border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <textarea
          placeholder="비고"
          name="remarks"
          value={form.remarks}
          onChange={handleFormChange}
          rows="3"
          style={{ width: "calc(100% - 16px)", marginBottom: 10, padding: 8, border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
        ></textarea>

        <button
          onClick={handleSubmit}
          style={{
            padding: "10px 20px",
            backgroundColor: editingUserCode ? '#ffc107' : '#007bff',
            color: editingUserCode ? 'black' : 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1em',
            marginRight: '10px'
          }}
        >
          {editingUserCode ? "수정 완료" : "등록"}
        </button>
        {editingUserCode && (
          <button
            onClick={() => { setEditingUserCode(null); setForm({ userId: "", name: "", phone: "", depositAmount: "", myCode: "", refCode: "", remarks: "", regDate: "" }); }}
            style={{
              padding: "10px 20px",
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1em'
            }}
          >
            취소
          </button>
        )}
      </div>

      <div style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>조직 관리</h3>
        <input
          placeholder="아이디, 이름, 코드로 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "calc(100% - 16px)", padding: 8, marginBottom: 10, border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={searchUsers} // 이 부분의 주석을 제거했습니다.
            style={{
              padding: "10px 15px",
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            검색
          </button>
          <button
            onClick={() => { setSearchQuery(""); setFilteredUsers([]); }}
            style={{
              padding: "10px 15px",
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            전체 회원 보기
          </button>
          <button
            onClick={saveBackup}
            style={{
              padding: "10px 15px",
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.9em'
            }}
          >
            백업 저장
          </button>
          <label style={{
            padding: "10px 15px",
            border: "1px solid #ccc",
            cursor: "pointer",
            backgroundColor: '#17a2b8',
            color: 'white',
            borderRadius: '5px',
            fontSize: '0.9em'
          }}>
            백업 복원
            <input type="file" accept="application/json" onChange={loadBackup} style={{ display: "none" }} />
          </label>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
            <span>조직도 크기:</span>
            <button
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                style={{ padding: '5px 10px', background: '#e9ecef', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer' }}
            >-</button>
            <span>{(zoomLevel * 100).toFixed(0)}%</span>
            <button
                onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.1))}
                style={{ padding: '5px 10px', background: '#e9ecef', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer' }}
            >+</button>
        </div>
      </div>

      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <button
          onClick={() => setShowAllUsers(!showAllUsers)}
          style={{
            padding: "10px 20px",
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1em'
          }}
        >
          {showAllUsers ? "전체 회원 목록 숨기기" : "전체 회원 목록 보기"}
        </button>
      </div>

      {showAllUsers && (
        <div style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fdfdfd', maxHeight: '400px', overflowY: 'auto' }}>
          <h4>전체 회원 목록</h4>
          {users.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', backgroundColor: '#f2f2f2' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>이름</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>아이디</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>전화번호</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>입금액</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>내 코드</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>추천인 코드</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>등록일</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>비고</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>좌측 인원</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>우측 인원</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const { left, right } = getLeftRightDescendantCounts(u.myCode, users);
                  return (
                    <tr key={u.myCode} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{u.name}</td>
                      <td style={{ padding: '8px' }}>{u.userId}</td>
                      <td style={{ padding: '8px' }}>{u.phone}</td>
                      <td style={{ padding: '8px' }}>{u.depositAmount || "없음"}</td>
                      <td style={{ padding: '8px' }}>{u.myCode}</td>
                      <td style={{ padding: '8px' }}>{u.refCode || "없음"}</td>
                      <td style={{ padding: '8px' }}>{u.regDate || "날짜 없음"}</td>
                      <td style={{ padding: '8px' }}>{u.remarks || "없음"}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{left}명</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{right}명</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button onClick={() => startEdit(u.myCode)} style={{ background: '#007bff', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '5px 10px', fontSize: '0.8em', marginRight: '5px' }}>수정</button>
                        <button onClick={() => deleteUser(u.myCode)} style={{ background: '#dc3545', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '5px 10px', fontSize: '0.8em' }}>삭제</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: '#777' }}>등록된 사용자가 없습니다.</p>
          )}
        </div>
      )}

      <h3 style={{ textAlign: 'center', color: '#0056b3', marginTop: '30px' }}>조직도</h3>
      <div style={{
          overflow: 'auto',
          padding: '20px',
          border: '1px solid #eee',
          borderRadius: '8px',
          minHeight: '200px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center'
      }}>
        {chartRootNodes.length > 0 ? (
            chartRootNodes.map(rootNode => renderOrgChart(rootNode))
        ) : (
            users.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#777' }}>등록된 사용자가 없습니다. 새로운 사용자를 등록하여 조직도를 만드세요.</p>
            ) : (
                <p style={{ textAlign: 'center', color: '#777' }}>
                    {filteredUsers.length > 0 && !users.find(u => u.myCode === searchQuery) ?
                        "해당 검색 코드를 가진 사용자가 조직도에 존재하지 않습니다." :
                        "조직도의 최상위 사용자(추천인 코드가 '0000'인 사용자)가 없습니다."
                    }
                    <br />가장 먼저 등록하는 사용자의 추천인 코드는 비워두거나 '0000'으로 입력해 주세요.
                    <br />(또는 "전체 회원 보기" 버튼을 클릭하여 모든 사용자를 확인하고, 필요시 '0000'을 가진 사용자를 추가하세요.)
                </p>
            )
        )}
      </div>
    </div>
  );
};

export default App;