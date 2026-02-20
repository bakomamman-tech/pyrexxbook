import { avatarUrl } from "../utils/api";
import "./Sidebar.css";

const QUICK_ITEMS = [
  "Profile Completeness",
  "Community Updates",
  "Saved Discussions",
  "Events and Spaces",
  "Security Tips"
];

export default function Sidebar({ user }) {
  if (!user) {
    return null;
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-profile">
        <img src={avatarUrl(user)} alt={user.name} />
        <div>
          <h3>{user.name}</h3>
          <p>@{user.username}</p>
        </div>
      </div>

      <div className="sidebar-stats">
        <div>
          <strong>{user.followers?.length || 0}</strong>
          <span>Followers</span>
        </div>
        <div>
          <strong>{user.following?.length || 0}</strong>
          <span>Following</span>
        </div>
      </div>

      <div className="sidebar-menu">
        {QUICK_ITEMS.map((item) => (
          <button key={item} type="button">
            {item}
          </button>
        ))}
      </div>
    </aside>
  );
}
