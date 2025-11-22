import HomeIcon from "@mui/icons-material/Home";
import { Link } from "react-router-dom";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import CreateIcon from "@mui/icons-material/Create";
import { useLocation } from "react-router";
import { useAuthedState } from "../ProtectedRoute";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

// https://mui.com/material-ui/react-list/
export default function MainMenu() {
  const location = useLocation();
  const { userName } = useAuthedState();

  return (
    <BottomNavigation
      value={location.pathname}
      showLabels
      sx={{
        width: "100%",
        position: "sticky",
        bottom: 0,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
      }}
    >
      <BottomNavigationAction
        icon={<HomeIcon />}
        label="Home"
        component={Link}
        to="/"
        value="/"
      />
      <BottomNavigationAction
        icon={<GroupsIcon />}
        label="Friends"
        component={Link}
        to="/friends"
        value="/friends"
      />
      <BottomNavigationAction
        icon={<PersonAddIcon />}
        label="Friend Requests"
        component={Link}
        to="/friendReqs"
        value="/friendReqs"
      />
    </BottomNavigation>
  );
}
