export default function getHands(key) {
  const keysList = {
    q: {
      leftHand: ["./public/fingers/left-fingers/q.png", "row-one"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    w: {
      leftHand: ["./public/fingers/left-fingers/w.png", "row-one"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    e: {
      leftHand: ["./public/fingers/left-fingers/e.png", "row-one"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    r: {
      leftHand: ["./public/fingers/left-fingers/r.png", "row-one"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    t: {
      leftHand: ["./public/fingers/left-fingers/t.png", "row-one"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    y: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/y.png", "row-one"],
    },
    u: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/u.png", "row-one"],
    },
    i: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/i.png", "row-one"],
    },
    o: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/o.png", "row-one"],
    },
    p: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/p.png", "row-one"],
    },

    a: {
      leftHand: ["./public/fingers/left-fingers/a.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    s: {
      leftHand: ["./public/fingers/left-fingers/s.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    d: {
      leftHand: ["./public/fingers/left-fingers/d.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    f: {
      leftHand: ["./public/fingers/left-fingers/f.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    g: {
      leftHand: ["./public/fingers/left-fingers/g.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    h: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/h.png", "row-two"],
    },
    j: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/j.png", "row-two"],
    },
    k: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/k.png", "row-two"],
    },
    l: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/l.png", "row-two"],
    },

    z: {
      leftHand: ["./public/fingers/left-fingers/z.png", "row-three"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    x: {
      leftHand: ["./public/fingers/left-fingers/x.png", "row-three"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    c: {
      leftHand: ["./public/fingers/left-fingers/c.png", "row-three"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    v: {
      leftHand: ["./public/fingers/left-fingers/v.png", "row-three"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    b: {
      leftHand: ["./public/fingers/left-fingers/b.png", "row-three"],
      rightHand: ["./public/fingers/right-fingers/right-rest.png", "row-two"],
    },
    n: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/n.png", "row-three"],
    },
    m: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/m.png", "row-three"],
    },
    "key-space": {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/space-right.png", "row-two"],
    },
    colon: {
      leftHand: ["./public/fingers/left-fingers/lshift.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/semi-colon.png", "row-two"],
    },
    smcln: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/semi-colon.png", "row-two"],
    },
    snqt: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/singleqt.png", "row-two"],
    },
    dbqt: {
      leftHand: ["./public/fingers/left-fingers/lshift.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/singleqt.png", "row-two"],
    },
    comma: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/comma.png", "row-two"],
    },
    period: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/period.png", "row-two"],
    },
    fdsh: {
      leftHand: ["./public/fingers/left-fingers/left-rest.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/qmark.png", "row-two"],
    },
    qmrk: {
      leftHand: ["./public/fingers/left-fingers/lshift.png", "row-two"],
      rightHand: ["./public/fingers/right-fingers/qmark.png", "row-two"],
    },
  };

  return keysList[key.toLowerCase()];
}
