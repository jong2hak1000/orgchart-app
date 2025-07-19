import React, { useState, useEffect } from "react";

const App = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", myCode: "", refCode: "" });
  const [searchCode, setSearchCode] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showAllUsers, setShowAllUsers] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("orgUsers");
    if (data) setUsers(JSON.parse(data));
  }, []);

  useEffect(() => {
    localStorage.setItem("orgUsers", JSON.stringify(users));
  }, [users]);

  const addUser = () => {
    if (!form.name || !form.phone || !form.myCode) return;

    const isDuplicateCode = users.some((u) => u.myCode === form.myCode);
    if (isDuplicateCode) {
      alert("'내 코드'는 중복될 수 없습니다. 다른 코드를 입력해 주세요.");
      return;
    }

    const sameRefCodeUsers = users.filter((u) => u.refCode === form.refCode);
    if (sameRefCodeUsers.length > 0) {
      const confirmRef = window.confirm(`이미 추천인 코드(${form.refCode})를 가진 사용자가 ${sameRefCodeUsers.length}명 존재합니다. 그래도 등록하시겠습니까?`);
      if (!confirmRef) return;
    }

    setUsers([...users, form]);
    setForm({ name: "", phone: "", myCode: "", refCode: "" });
    setFilteredUsers([]);
  };

  const deleteUser = (code) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    setUsers(users.filter((u) => u.myCode !== code));
    setFilteredUsers([]);
  };

  const searchByCode = () => {
    if (!searchCode) return;
    const collectTree = (code) => {
      let result = [];
      const children = users.filter((u) => u.refCode === code);
      for (const child of children) {
        result.push(child);
        result = result.concat(collectTree(child.myCode));
      }
      return result;
    };
    const rootUser = users.find((u) => u.myCode === searchCode);
    if (!rootUser) return alert("해당 코드를 가진 사용자가 없습니다.");
    const tree = [rootUser, ...collectTree(searchCode)];

    const adjustedTree = tree.map((u) =>
      u.myCode === searchCode ? { ...u, refCode: "" } : u
    );

    setFilteredUsers(adjustedTree);
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
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          setUsers(data);
          setFilteredUsers([]);
          alert("백업 데이터를 복원했습니다.");
        } else {
          alert("올바르지 않은 파일 형식입니다.");
        }
      } catch {
        alert("파일을 읽는 중 오류가 발생했습니다.");
      }
    };
    reader.readAsText(file);
  };

  const ensureRootUser = (list) => {
    const hasRoot = list.some((u) => u.refCode === "");
    if (!hasRoot && list.length > 0) {
      const first = list[0];
      return list.map((u) => u.myCode === first.myCode ? { ...u, refCode: "" } : u);
    }
    return list;
  };

  const renderTree = (list, parentCode = "", level = 0) => {
    return list
      .filter((u) => u.refCode === parentCode)
      .map((u) => (
        <div
          key={u.myCode}
          style={{ marginLeft: level * 20, padding: 5, borderLeft: "2px solid #ccc" }}
        >
          └ <strong>{u.name}</strong> [{u.myCode}]
          <button onClick={() => deleteUser(u.myCode)} style={{ marginLeft: 10 }}>삭제</button>
          {renderTree(list, u.myCode, level + 1)}
        </div>
      ));
  };

  return (
    <div style={{ maxWidth: 600, margin: "30px auto", padding: 20, fontFamily: "Arial" }}>
      <h2>추천인 조직도</h2>
      <input
        placeholder="이름"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />
      <input
        placeholder="전화번호"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />
      <input
        placeholder="내 코드"
        value={form.myCode}
        onChange={(e) => setForm({ ...form, myCode: e.target.value })}
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />
      <input
        placeholder="추천인 코드"
        value={form.refCode}
        onChange={(e) => setForm({ ...form, refCode: e.target.value })}
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />
      <button onClick={addUser} style={{ padding: "10px 20px", marginBottom: 20 }}>등록</button>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="코드로 검색"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          style={{ width: "50%", padding: 8, marginRight: 10 }}
        />
        <button onClick={searchByCode} style={{ padding: "10px 15px", marginRight: 10 }}>검색</button>
        <button onClick={() => setFilteredUsers([])} style={{ padding: "10px 15px", marginRight: 10 }}>전체 보기</button>
        <button onClick={saveBackup} style={{ padding: "10px 15px", marginRight: 10 }}>백업 저장</button>
        <label style={{ padding: "10px 15px", border: "1px solid #ccc", cursor: "pointer" }}>
          복원
          <input type="file" accept="application/json" onChange={loadBackup} style={{ display: "none" }} />
        </label>
        <button onClick={() => setShowAllUsers(!showAllUsers)} style={{ padding: "10px 15px", marginLeft: 10 }}>
          {showAllUsers ? "전체 사용자 숨기기" : "전체 사용자 보기"}
        </button>
      </div>

      {showAllUsers && (
        <div style={{ marginBottom: 20 }}>
          <h4>전체 사용자 목록</h4>
          <ul>
            {users.map((u) => (
              <li key={u.myCode}>{u.name} / {u.phone} / 코드: {u.myCode} / 추천인: {u.refCode}</li>
            ))}
          </ul>
        </div>
      )}

      <h3>조직도</h3>
      <div>{renderTree(ensureRootUser(filteredUsers.length > 0 ? filteredUsers : users))}</div>
    </div>
  );
};

export default App;
