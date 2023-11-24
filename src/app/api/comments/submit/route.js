import { supabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();

  const { post_id, email, comment, nickname, uid } = body;

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id,
      email,
      nickname,
      payload: comment,
    })
    .select("id");

  if (error) {
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  await fetch(
    "https://hooks.slack.com/services/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",
    {
      method: "POST",
      body: JSON.stringify({
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "New comment waiting for approval! :meow_party:",
              emoji: true,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Blog post:*\nhttp://localhost:3000/articles/${uid}`,
              },
              {
                type: "mrkdwn",
                text: `*Comment ID:*\n<https://supabase.com/dashboard/project/kmimxhcpximbajtshrve/editor/28564|${post_id}>`,
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Comment:*\n${comment}`,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `*Submitted by:* ${nickname} (<mailto:${email}|${email}>)`,
              },
            ],
          },
          {
            type: "divider",
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  emoji: true,
                  text: "Approve",
                },
                style: "primary",
                action_id: "approve_comment",
                value: data[0].id,
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  emoji: true,
                  text: "Delete",
                },
                style: "danger",
                action_id: "delete_comment",
                value: data[0].id,
                confirm: {
                  title: {
                    type: "plain_text",
                    text: "Are you sure?",
                  },
                  text: {
                    type: "mrkdwn",
                    text: "This will delete the comment permanently.",
                  },
                  confirm: {
                    type: "plain_text",
                    text: "Delete",
                  },
                  deny: {
                    type: "plain_text",
                    text: "Cancel",
                  },
                  style: "danger",
                },
              },
            ],
          },
        ],
      }),
    }
  );

  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
  });
}
