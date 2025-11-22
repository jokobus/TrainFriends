import { Card, CardContent } from "@mui/material";
import { ComponentProps, ReactNode } from "react";

export const StandardCard = ({
  children,
  ...props
}: { children?: ReactNode } & ComponentProps<typeof Card>) => {
  return (
    <Card
      sx={{
        width: {
          xs: "100vw",
          sm: "75vw",
          md: "50vw",
          lg: "33vw",
          xl: "25vw",
        },
        height: "auto",
        p: 2,
        ...props.sx,
      }}
      {...props}
    >
      <CardContent sx = {{ padding: 0 }}>
        {children}
      </CardContent>

    </Card>
  );
};
